import { D, money, qty, toNumber, type Decimal } from "@/lib/decimal";
import { prisma } from "@/lib/prisma";
import type { PurchaseInput } from "@/server/validation/entries";

/**
 * FR-6: weighted average cost.
 *
 *   newAverage = (oldQty x oldAverage + newQty x newUnitCost) / (oldQty + newQty)
 *
 * If existing stock is zero or negative — which it can be, since negative stock
 * is allowed (FR-4) — there is no meaningful history to weight against, so the
 * new purchase price simply becomes the average.
 */
export function weightedAverageCost(
  existingQty: Decimal | number | string,
  existingAvg: Decimal | number | string,
  purchasedQty: Decimal | number | string,
  purchasedUnitCost: Decimal | number | string,
): Decimal {
  const oldQty = new D(existingQty as never);
  const newQty = new D(purchasedQty as never);
  if (oldQty.lessThanOrEqualTo(0)) return money(new D(purchasedUnitCost as never));

  const total = oldQty.times(new D(existingAvg as never)).plus(newQty.times(new D(purchasedUnitCost as never)));
  const combined = oldQty.plus(newQty);
  return combined.isZero() ? money(new D(purchasedUnitCost as never)) : money(total.dividedBy(combined));
}

/**
 * A purchase increases stock and re-prices the material, atomically. Unit cost is
 * derived from total cost rather than typed — one less field on the phone, and
 * the total is the number written on the receipt she is looking at.
 */
export async function recordPurchase(input: PurchaseInput) {
  const quantity = qty(input.quantity);
  const totalCost = money(input.totalCost);
  const unitCost = quantity.isZero() ? new D(0) : money(totalCost.dividedBy(quantity));

  return prisma.$transaction(async (tx) => {
    const material = await tx.rawMaterial.findUniqueOrThrow({
      where: { id: input.rawMaterialId },
      select: { id: true, name: true, quantityOnHand: true, averageCost: true },
    });

    const purchase = await tx.rawMaterialPurchase.create({
      data: {
        rawMaterialId: material.id,
        quantity,
        unitCost,
        totalCost,
        supplier: input.supplier,
        purchasedAt: input.purchasedAt,
        notes: input.notes,
      },
    });

    await tx.rawMaterial.update({
      where: { id: material.id },
      data: {
        quantityOnHand: { increment: quantity },
        averageCost: weightedAverageCost(
          material.quantityOnHand,
          material.averageCost,
          quantity,
          unitCost,
        ),
      },
    });

    return { purchase, materialName: material.name };
  });
}

export async function listPurchases({ take = 50 }: { take?: number } = {}) {
  const purchases = await prisma.rawMaterialPurchase.findMany({
    orderBy: { purchasedAt: "desc" },
    take,
    include: { rawMaterial: { select: { name: true, unit: true } } },
  });

  return purchases.map((p) => ({
    id: p.id,
    name: p.rawMaterial.name,
    unit: p.rawMaterial.unit,
    quantity: toNumber(p.quantity),
    totalCost: toNumber(p.totalCost),
    supplier: p.supplier,
    purchasedAt: p.purchasedAt,
  }));
}

/**
 * Materials ordered by how recently she bought them, so the picker's top entries
 * are the ones she is most likely to want (BUILD_SPEC §3.3).
 */
export async function listMaterialsByRecency() {
  const materials = await prisma.rawMaterial.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      unit: true,
      quantityOnHand: true,
      purchases: { orderBy: { purchasedAt: "desc" }, take: 1, select: { purchasedAt: true } },
    },
  });

  return materials
    .map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      quantityOnHand: toNumber(m.quantityOnHand),
      lastUsed: m.purchases[0]?.purchasedAt ?? null,
    }))
    .sort((a, b) => {
      if (a.lastUsed && b.lastUsed) return b.lastUsed.getTime() - a.lastUsed.getTime();
      if (a.lastUsed) return -1;
      if (b.lastUsed) return 1;
      return a.name.localeCompare(b.name);
    });
}
