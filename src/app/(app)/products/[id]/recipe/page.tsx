import { notFound } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { getProduct } from "@/server/services/products";
import { getRecipe } from "@/server/services/recipes";
import { listRawMaterials } from "@/server/services/raw-materials";
import { RecipeEditor } from "./recipe-editor";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, recipe, materials] = await Promise.all([
    getProduct(id),
    getRecipe(id),
    listRawMaterials(),
  ]);
  if (!product) notFound();

  // Keeps the "no materials yet" case from looking like a broken form.
  if (materials.length === 0) {
    return (
      <div>
        <PageHeader title="Recipe" subtitle={product.name} backHref={`/products/${id}`} />
        <EmptyState
          title="Add raw materials first"
          hint="A recipe is built from the materials you buy, so add those before setting one."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Recipe"
        subtitle={`One batch of ${product.name}`}
        backHref={`/products/${id}`}
      />
      <RecipeEditor
        productId={id}
        productName={product.name}
        sellingPrice={product.sellingPrice}
        materials={materials.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          averageCost: m.averageCost,
        }))}
        initial={{
          yieldQty: recipe ? String(recipe.yieldQty) : "",
          yieldUnit: recipe?.yieldUnit ?? "",
          notes: recipe?.notes ?? "",
          ingredients:
            recipe?.ingredients.map((ing) => ({
              key: ing.id,
              rawMaterialId: ing.rawMaterialId,
              quantity: String(ing.quantity),
            })) ?? [],
        }}
      />
    </div>
  );
}
