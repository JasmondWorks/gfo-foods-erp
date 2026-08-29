import { EmptyState, PageHeader } from "@/components/common/page-header";
import { listProductsWithRecipe } from "@/server/services/products";
import { BatchForm } from "./batch-form";

export default async function NewBatchPage() {
  const products = await listProductsWithRecipe();

  return (
    <div>
      <PageHeader title="New batch" backHref="/" />
      {products.length === 0 ? (
        <EmptyState
          title="No product has a recipe yet"
          hint="A batch consumes raw materials per a recipe, so set one up first."
        />
      ) : (
        <BatchForm products={products} />
      )}
    </div>
  );
}
