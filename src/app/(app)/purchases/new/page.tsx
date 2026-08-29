import { EmptyState, PageHeader } from "@/components/common/page-header";
import { listMaterialsByRecency } from "@/server/services/purchases";
import { PurchaseForm } from "./purchase-form";

export default async function NewPurchasePage() {
  const materials = await listMaterialsByRecency();

  return (
    <div>
      <PageHeader title="Log purchase" backHref="/" />
      {materials.length === 0 ? (
        <EmptyState
          title="Add a raw material first"
          hint="Purchases are logged against the materials you buy."
        />
      ) : (
        <PurchaseForm materials={materials} />
      )}
    </div>
  );
}
