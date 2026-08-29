import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatNaira } from "@/lib/format";
import { listSales } from "@/server/services/sales";

export default async function SalesPage() {
  const sales = await listSales();

  return (
    <div>
      <PageHeader
        title="Sales"
        action={
          <Button asChild size="icon" aria-label="New sale">
            <Link href="/sales/new">
              <Plus className="size-5" />
            </Link>
          </Button>
        }
      />

      {sales.length === 0 ? (
        <EmptyState title="No sales yet" hint="Log a sale and the numbers start filling in." />
      ) : (
        <ul className="divide-y rounded-xl border">
          {sales.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sales/${s.id}`}
                className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {s.customerName ?? "Walk-in"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(s.saleDate)} · {s.itemCount} item{s.itemCount > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {s.paymentStatus !== "PAID" ? (
                    <Badge variant={s.paymentStatus === "UNPAID" ? "destructive" : "secondary"}>
                      {s.paymentStatus === "UNPAID" ? "Unpaid" : "Part paid"}
                    </Badge>
                  ) : null}
                  <span className="font-medium">{formatNaira(s.totalAmount)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
