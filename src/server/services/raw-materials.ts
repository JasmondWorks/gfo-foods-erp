import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import type { RawMaterialInput } from "@/server/validation/raw-materials";

/**
 * Decimal instances can't cross the server/client boundary, so every service
 * returns plain numbers. Precision-critical arithmetic stays server-side.
 */
function serialise<T extends { quantityOnHand: unknown; reorderThreshold: unknown; averageCost: unknown }>(
  m: T,
) {
  return {
    ...m,
    quantityOnHand: toNumber(m.quantityOnHand as never),
    reorderThreshold: toNumber(m.reorderThreshold as never),
    averageCost: toNumber(m.averageCost as never),
  };
}

export async function listRawMaterials() {
  const materials = await prisma.rawMaterial.findMany({ orderBy: { name: "asc" } });
  return materials.map(serialise).map((m) => ({
    ...m,
    // Threshold of 0 means "not tracked" — don't flag every empty material.
    isLow: m.reorderThreshold > 0 && m.quantityOnHand <= m.reorderThreshold,
  }));
}

export async function getRawMaterial(id: string) {
  const material = await prisma.rawMaterial.findUnique({
    where: { id },
    include: {
      purchases: { orderBy: { purchasedAt: "desc" }, take: 20 },
      batchConsumptions: {
        orderBy: { batch: { producedAt: "desc" } },
        take: 20,
        include: { batch: { select: { batchNumber: true, producedAt: true } } },
      },
      _count: { select: { recipeIngredients: true } },
    },
  });
  if (!material) return null;

  return {
    ...serialise(material),
    purchases: material.purchases.map((p) => ({
      ...p,
      quantity: toNumber(p.quantity),
      unitCost: toNumber(p.unitCost),
      totalCost: toNumber(p.totalCost),
    })),
    batchConsumptions: material.batchConsumptions.map((c) => ({
      ...c,
      quantityUsed: toNumber(c.quantityUsed),
      unitCost: toNumber(c.unitCost),
    })),
  };
}

export async function createRawMaterial(input: RawMaterialInput) {
  return prisma.rawMaterial.create({
    data: {
      name: input.name,
      unit: input.unit,
      reorderThreshold: input.reorderThreshold,
    },
  });
}

export async function updateRawMaterial(id: string, input: RawMaterialInput) {
  // quantityOnHand and averageCost are deliberately absent: stock moves only
  // through purchases, batches and stock counts (FR-2).
  return prisma.rawMaterial.update({
    where: { id },
    data: {
      name: input.name,
      unit: input.unit,
      reorderThreshold: input.reorderThreshold,
    },
  });
}

/** Refuses to delete anything with history — that history is the traceability record. */
export async function deleteRawMaterial(id: string) {
  const counts = await prisma.rawMaterial.findUnique({
    where: { id },
    select: {
      _count: { select: { purchases: true, recipeIngredients: true, batchConsumptions: true } },
    },
  });
  if (!counts) return { ok: false as const, reason: "Material not found." };

  const { purchases, recipeIngredients, batchConsumptions } = counts._count;
  if (purchases || batchConsumptions) {
    return { ok: false as const, reason: "This material has purchase or production history, so it can't be deleted." };
  }
  if (recipeIngredients) {
    return { ok: false as const, reason: "This material is used in a recipe. Remove it from the recipe first." };
  }

  await prisma.rawMaterial.delete({ where: { id } });
  return { ok: true as const };
}
