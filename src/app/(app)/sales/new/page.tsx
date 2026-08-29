import { EmptyState, PageHeader } from "@/components/common/page-header";
import { listProductsByRecency } from "@/server/services/sales";
import { SaleForm } from "./sale-form";

export default async function NewSalePage() {
  const products = await listProductsByRecency();

  return (
    <div>
      <PageHeader title="New sale" backHref="/" />
      {products.length === 0 ? (
        <EmptyState title="Add a product first" hint="Sales are recorded against your products." />
      ) : (
        <SaleForm products={products} />
      )}
    </div>
  );
}
