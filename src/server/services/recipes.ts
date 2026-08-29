import { D, toNumber, money, type Decimal } from "@/lib/decimal";
import { prisma } from "@/lib/prisma";
import type { RecipeInput } from "@/server/validation/products";

type CostIngredient = {
  quantity: Decimal | string | number;
  rawMaterial: { averageCost: Decimal | string | number };
};

/**
 * FR-6: material cost per unit = Σ(ingredient qty × material averageCost) ÷ yield.
 * Computed in Decimal, rounded once at the end.
 */
export function materialCostPerUnit(
  ingredients: CostIngredient[],
  yieldQty: Decimal | string | number,
): Decimal {
  const total = ingredients.reduce(
    (sum, ing) => sum.plus(new D(ing.quantity as never).times(new D(ing.rawMaterial.averageCost as never))),
    new D(0),
  );
  const y = new D(yieldQty as never);
  return y.isZero() ? new D(0) : money(total.dividedBy(y));
}

export async function getRecipe(productId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { productId },
    include: {
      ingredients: {
        include: { rawMaterial: true },
        orderBy: { rawMaterial: { name: "asc" } },
      },
    },
  });
  if (!recipe) return null;

  const costPerUnit = materialCostPerUnit(recipe.ingredients, recipe.yieldQty);

  return {
    id: recipe.id,
    productId: recipe.productId,
    yieldQty: toNumber(recipe.yieldQty),
    yieldUnit: recipe.yieldUnit,
    notes: recipe.notes,
    costPerUnit: toNumber(costPerUnit),
    ingredients: recipe.ingredients.map((ing) => ({
      id: ing.id,
      rawMaterialId: ing.rawMaterialId,
      name: ing.rawMaterial.name,
      unit: ing.rawMaterial.unit,
      quantity: toNumber(ing.quantity),
      averageCost: toNumber(ing.rawMaterial.averageCost),
      lineCost: toNumber(money(new D(ing.quantity).times(new D(ing.rawMaterial.averageCost)))),
    })),
  };
}

/**
 * Upserts the whole recipe in one transaction. Ingredients are replaced wholesale
 * rather than diffed — a recipe is a handful of rows, and past batches keep their
 * own BatchConsumption snapshot, so rewriting here never rewrites history.
 */
export async function saveRecipe(productId: string, input: RecipeInput) {
  return prisma.$transaction(async (tx) => {
    const recipe = await tx.recipe.upsert({
      where: { productId },
      create: {
        productId,
        yieldQty: input.yieldQty,
        yieldUnit: input.yieldUnit,
        notes: input.notes,
      },
      update: {
        yieldQty: input.yieldQty,
        yieldUnit: input.yieldUnit,
        notes: input.notes,
      },
    });

    await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
    await tx.recipeIngredient.createMany({
      data: input.ingredients.map((ing) => ({
        recipeId: recipe.id,
        rawMaterialId: ing.rawMaterialId,
        quantity: ing.quantity,
      })),
    });

    return recipe;
  });
}
