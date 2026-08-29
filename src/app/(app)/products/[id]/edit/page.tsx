import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { updateProductAction } from "@/server/actions/products";
import { getProduct } from "@/server/services/products";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div>
      <PageHeader title="Edit product" backHref={`/products/${id}`} />
      <ProductForm
        action={updateProductAction.bind(null, id)}
        submitLabel="Save changes"
        values={{
          name: product.name,
          packageSize: product.packageSize ?? "",
          sellingPrice: String(product.sellingPrice),
          reorderThreshold: String(product.reorderThreshold),
          trackExpiry: product.trackExpiry,
          shelfLifeDays: product.shelfLifeDays ? String(product.shelfLifeDays) : "",
        }}
      />
    </div>
  );
}
