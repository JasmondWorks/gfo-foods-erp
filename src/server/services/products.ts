import { D, toNumber } from "@/lib/decimal";
import { prisma } from "@/lib/prisma";
import { materialCostPerUnit } from "@/server/services/recipes";
import type { ProductInput } from "@/server/validation/products";

export async function listProducts() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { recipe: { select: { id: true } } },
  });

  return products.map((p) => {
    const quantityOnHand = toNumber(p.quantityOnHand);
    const reorderThreshold = toNumber(p.reorderThreshold);
    return {
      id: p.id,
      name: p.name,
      packageSize: p.packageSize,
      sellingPrice: toNumber(p.sellingPrice),
      quantityOnHand,
      reorderThreshold,
      hasRecipe: p.recipe !== null,
      isLow: reorderThreshold > 0 && quantityOnHand <= reorderThreshold,
    };
  });
}

/** Products a batch can be logged against — i.e. the ones with a recipe. */
export async function listProductsWithRecipe() {
  const products = await prisma.product.findMany({
    where: { recipe: { isNot: null } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, packageSize: true },
  });
  return products;
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      recipe: { include: { ingredients: { include: { rawMaterial: true } } } },
      batches: { orderBy: { producedAt: "desc" }, take: 10 },
      saleItems: {
        orderBy: { sale: { saleDate: "desc" } },
        take: 10,
        include: { sale: { select: { id: true, saleDate: true } } },
      },
    },
  });
  if (!product) return null;

  const sellingPrice = new D(product.sellingPrice);
  const costPerUnit = product.recipe
    ? materialCostPerUnit(product.recipe.ingredients, product.recipe.yieldQty)
    : null;

  return {
    id: product.id,
    name: product.name,
    packageSize: product.packageSize,
    trackExpiry: product.trackExpiry,
    shelfLifeDays: product.shelfLifeDays,
    sellingPrice: toNumber(sellingPrice),
    quantityOnHand: toNumber(product.quantityOnHand),
    reorderThreshold: toNumber(product.reorderThreshold),
    hasRecipe: product.recipe !== null,
    // Null when there is no recipe — an unknown margin must not read as a zero one.
    costPerUnit: costPerUnit ? toNumber(costPerUnit) : null,
    marginPerUnit: costPerUnit ? toNumber(sellingPrice.minus(costPerUnit)) : null,
    batches: product.batches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      quantityMade: toNumber(b.quantityMade),
      producedAt: b.producedAt,
      expiryDate: b.expiryDate,
    })),
    saleItems: product.saleItems.map((s) => ({
      id: s.id,
      saleId: s.saleId,
      saleDate: s.sale.saleDate,
      quantity: toNumber(s.quantity),
      lineTotal: toNumber(s.lineTotal),
    })),
  };
}

function toData(input: ProductInput) {
  return {
    name: input.name,
    packageSize: input.packageSize,
    sellingPrice: input.sellingPrice,
    reorderThreshold: input.reorderThreshold,
    trackExpiry: input.trackExpiry,
    shelfLifeDays: input.trackExpiry ? input.shelfLifeDays : null,
  };
}

export async function createProduct(input: ProductInput) {
  return prisma.product.create({ data: toData(input) });
}

export async function updateProduct(id: string, input: ProductInput) {
  // quantityOnHand is absent by design — it moves only via batches, sales and
  // stock counts (FR-3).
  return prisma.product.update({ where: { id }, data: toData(input) });
}

export async function deleteProduct(id: string) {
  const counts = await prisma.product.findUnique({
    where: { id },
    select: { _count: { select: { batches: true, saleItems: true } } },
  });
  if (!counts) return { ok: false as const, reason: "Product not found." };

  if (counts._count.batches || counts._count.saleItems) {
    return {
      ok: false as const,
      reason: "This product has production or sales history, so it can't be deleted.",
    };
  }

  // The recipe cascades with the product; nothing else references it.
  await prisma.product.delete({ where: { id } });
  return { ok: true as const };
}
