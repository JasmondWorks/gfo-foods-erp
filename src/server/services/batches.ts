import { Prisma } from "@prisma/client";
import { D, money, qty, toNumber } from "@/lib/decimal";
import { prisma } from "@/lib/prisma";
import { TIME_ZONE } from "@/lib/format";
import type { BatchInput } from "@/server/validation/entries";

/** "Suya Spice Mix 50g" -> "SUYA". Batch numbers are historical strings, so a
 *  later rename never rewrites the ones already issued. */
function productCode(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, "").trim().toUpperCase();
  return (cleaned.split(/\s+/)[0] ?? "BATCH").slice(0, 6) || "BATCH";
}

function datePart(date: Date): string {
  // en-CA gives yyyy-mm-dd; strip the dashes. Lagos time, not UTC.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE })
    .format(date)
    .replace(/-/g, "");
}

/** {PRODUCT_CODE}-{YYYYMMDD}-{SEQ}, sequence scoped to that prefix. */
async function nextBatchNumber(
  tx: Prisma.TransactionClient,
  productName: string,
  producedAt: Date,
): Promise<string> {
  const prefix = `${productCode(productName)}-${datePart(producedAt)}`;
  const taken = await tx.batch.count({ where: { batchNumber: { startsWith: `${prefix}-` } } });
  return `${prefix}-${String(taken + 1).padStart(2, "0")}`;
}

export type BatchShortage = { name: string; needed: number; available: number; unit: string };

/**
 * PROJECT_CONTEXT §9. One transaction: consume raw materials per the recipe,
 * snapshot what was consumed, and increase finished stock. A partial failure
 * must roll back entirely — inconsistent stock is the bug that quietly destroys
 * trust over months of real use.
 *
 * Short stock does NOT block the save (FR-4). Real life runs ahead of data
 * entry, so shortages are reported back to be shown as a warning.
 */
export async function recordBatch(input: BatchInput) {
  const quantityMade = qty(input.quantityMade);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: input.productId },
      select: { id: true, name: true, trackExpiry: true, shelfLifeDays: true },
    });

    const recipe = await tx.recipe.findUnique({
      where: { productId: product.id },
      include: { ingredients: { include: { rawMaterial: true } } },
    });
    if (!recipe) {
      throw new Error(`${product.name} has no recipe yet, so a batch can't be logged.`);
    }

    const scale = quantityMade.dividedBy(new D(recipe.yieldQty));

    let expiryDate = input.expiryDate;
    if (!expiryDate && product.trackExpiry && product.shelfLifeDays) {
      expiryDate = new Date(input.producedAt);
      expiryDate.setDate(expiryDate.getDate() + product.shelfLifeDays);
    }

    const batch = await tx.batch.create({
      data: {
        batchNumber: await nextBatchNumber(tx, product.name, input.producedAt),
        productId: product.id,
        quantityMade,
        producedAt: input.producedAt,
        expiryDate,
        notes: input.notes,
      },
    });

    const shortages: BatchShortage[] = [];
    let batchCost = new D(0);

    for (const ingredient of recipe.ingredients) {
      const needed = qty(new D(ingredient.quantity).times(scale));
      const available = new D(ingredient.rawMaterial.quantityOnHand);

      if (available.lessThan(needed)) {
        shortages.push({
          name: ingredient.rawMaterial.name,
          needed: toNumber(needed),
          available: toNumber(available),
          unit: ingredient.rawMaterial.unit,
        });
      }

      await tx.rawMaterial.update({
        where: { id: ingredient.rawMaterialId },
        data: { quantityOnHand: { decrement: needed } },
      });

      // A snapshot, not a reference to the live recipe — recipes change,
      // history must not.
      await tx.batchConsumption.create({
        data: {
          batchId: batch.id,
          rawMaterialId: ingredient.rawMaterialId,
          quantityUsed: needed,
          unitCost: ingredient.rawMaterial.averageCost,
        },
      });

      batchCost = batchCost.plus(needed.times(new D(ingredient.rawMaterial.averageCost)));
    }

    await tx.batch.update({
      where: { id: batch.id },
      data: { unitCost: quantityMade.isZero() ? new D(0) : money(batchCost.dividedBy(quantityMade)) },
    });

    await tx.product.update({
      where: { id: product.id },
      data: { quantityOnHand: { increment: quantityMade } },
    });

    return {
      batchNumber: batch.batchNumber,
      batchId: batch.id,
      productName: product.name,
      shortages,
    };
  });
}

/** Powers the live availability check on the batch form, before anything is saved. */
export async function previewBatch(productId: string, quantityMade: number) {
  const recipe = await prisma.recipe.findUnique({
    where: { productId },
    include: { ingredients: { include: { rawMaterial: true } } },
  });
  if (!recipe || !Number.isFinite(quantityMade) || quantityMade <= 0) return null;

  const scale = new D(quantityMade).dividedBy(new D(recipe.yieldQty));

  return {
    yieldQty: toNumber(recipe.yieldQty),
    ingredients: recipe.ingredients.map((ing) => {
      const needed = qty(new D(ing.quantity).times(scale));
      const available = new D(ing.rawMaterial.quantityOnHand);
      return {
        id: ing.id,
        name: ing.rawMaterial.name,
        unit: ing.rawMaterial.unit,
        needed: toNumber(needed),
        available: toNumber(available),
        short: available.lessThan(needed),
      };
    }),
  };
}

const DAY = 86_400_000;

export async function listBatches({ take = 50 }: { take?: number } = {}) {
  const batches = await prisma.batch.findMany({
    orderBy: { producedAt: "desc" },
    take,
    include: { product: { select: { name: true } } },
  });

  // Days-to-expiry is resolved here rather than during render: reading the clock
  // in a component makes the output depend on when React happens to re-render.
  const now = Date.now();

  return batches.map((b) => ({
    id: b.id,
    batchNumber: b.batchNumber,
    productName: b.product.name,
    quantityMade: toNumber(b.quantityMade),
    producedAt: b.producedAt,
    expiryDate: b.expiryDate,
    daysToExpiry: b.expiryDate ? Math.ceil((b.expiryDate.getTime() - now) / DAY) : null,
  }));
}

export async function getBatch(id: string) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true } },
      consumptions: { include: { rawMaterial: { select: { name: true, unit: true } } } },
    },
  });
  if (!batch) return null;

  const quantityMade = new D(batch.quantityMade);
  const totalCost = batch.consumptions.reduce(
    (sum, c) => sum.plus(new D(c.quantityUsed).times(new D(c.unitCost))),
    new D(0),
  );

  return {
    id: batch.id,
    batchNumber: batch.batchNumber,
    product: batch.product,
    quantityMade: toNumber(quantityMade),
    producedAt: batch.producedAt,
    expiryDate: batch.expiryDate,
    notes: batch.notes,
    totalCost: toNumber(money(totalCost)),
    unitCost: toNumber(batch.unitCost),
    consumptions: batch.consumptions.map((c) => ({
      id: c.id,
      name: c.rawMaterial.name,
      unit: c.rawMaterial.unit,
      quantityUsed: toNumber(c.quantityUsed),
      lineCost: toNumber(money(new D(c.quantityUsed).times(new D(c.unitCost)))),
    })),
  };
}
