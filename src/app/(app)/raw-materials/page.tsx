import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatQty } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { listRawMaterials } from "@/server/services/raw-materials";

export default async function RawMaterialsPage() {
  const materials = await listRawMaterials();

  return (
    <div>
      <PageHeader
        title="Raw materials"
        subtitle={`${materials.length} tracked`}
        action={
          <Button asChild size="icon" aria-label="New material">
            <Link href="/raw-materials/new">
              <Plus className="size-5" />
            </Link>
          </Button>
        }
      />

      {materials.length === 0 ? (
        <EmptyState
          title="No materials yet"
          hint="Add the ingredients and packaging you buy, then log purchases against them."
        />
      ) : (
        <ul className="divide-y rounded-xl border">
          {materials.map((m) => (
            <li key={m.id}>
              <Link
                href={`/raw-materials/${m.id}`}
                className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{m.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatQty(m.quantityOnHand, unitLabel(m.unit))} in stock
                  </span>
                </span>
                {m.isLow ? <Badge variant="destructive">Low</Badge> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
