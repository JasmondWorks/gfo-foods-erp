import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { formatDate, formatNaira, formatQty } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { listPurchases } from "@/server/services/purchases";

export default async function PurchasesPage() {
  const purchases = await listPurchases();

  return (
    <div>
      <PageHeader
        title="Purchases"
        action={
          <Button asChild size="icon" aria-label="Log purchase">
            <Link href="/purchases/new">
              <Plus className="size-5" />
            </Link>
          </Button>
        }
      />

      {purchases.length === 0 ? (
        <EmptyState title="No purchases logged yet" />
      ) : (
        <ul className="divide-y rounded-xl border">
          {purchases.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="text-muted-foreground text-xs">
                  {formatQty(p.quantity, unitLabel(p.unit))} · {formatDate(p.purchasedAt)}
                  {p.supplier ? ` · ${p.supplier}` : ""}
                </span>
              </span>
              <span className="shrink-0 font-medium">{formatNaira(p.totalCost)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
