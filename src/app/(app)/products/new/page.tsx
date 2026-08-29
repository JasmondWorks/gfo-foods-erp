import { PageHeader } from "@/components/common/page-header";
import { createProductAction } from "@/server/actions/products";
import { ProductForm } from "../product-form";

export default function NewProductPage() {
  return (
    <div>
      <PageHeader
        title="New product"
        subtitle="You'll set the recipe next."
        backHref="/products"
      />
      <ProductForm action={createProductAction} submitLabel="Save and set recipe" />
    </div>
  );
}
