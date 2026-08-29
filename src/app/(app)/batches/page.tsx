import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatQty } from "@/lib/format";
import { listBatches } from "@/server/services/batches";

export default async function BatchesPage() {
  const batches = await listBatches();

  return (
    <div>
      <PageHeader
        title="Batches"
        action={
          <Button asChild size="icon" aria-label="New batch">
            <Link href="/batches/new">
              <Plus className="size-5" />
            </Link>
          </Button>
        }
      />

      {batches.length === 0 ? (
        <EmptyState title="No batches yet" hint="Log a production run to build up stock." />
      ) : (
        <ul className="divide-y rounded-xl border">
          {batches.map((b) => {
            const days = b.daysToExpiry;
            return (
              <li key={b.id}>
                <Link
                  href={`/batches/${b.id}`}
                  className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{b.productName}</span>
                    <span className="text-muted-foreground text-xs">
                      {b.batchNumber} · {formatQty(b.quantityMade)} · {formatDate(b.producedAt)}
                    </span>
                  </span>
                  {days !== null && days <= 30 ? (
                    <Badge variant={days < 0 ? "destructive" : "secondary"}>
                      {days < 0 ? "Expired" : `${days}d`}
                    </Badge>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
