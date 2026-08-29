import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNaira, formatQty } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { getBatch } from "@/server/services/batches";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batch = await getBatch(id);
  if (!batch) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        title={batch.batchNumber}
        subtitle={batch.product.name}
        backHref="/batches"
      />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">Made</p>
            <p className="text-lg font-semibold">{formatQty(batch.quantityMade)}</p>
            <p className="text-muted-foreground text-xs">{formatDate(batch.producedAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">Cost per unit</p>
            <p className="text-lg font-semibold">{formatNaira(batch.unitCost)}</p>
            <p className="text-muted-foreground text-xs">
              {formatNaira(batch.totalCost)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {batch.expiryDate ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">Expires</p>
            <p className="font-medium">{formatDate(batch.expiryDate)}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Full traceability: exactly what went into this run, at the cost it was
          carrying then — not what the recipe says today. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">What went in</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {batch.consumptions.map((c) => (
              <li key={c.id} className="flex justify-between py-2 text-sm">
                <span>
                  <span className="block">{c.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatQty(c.quantityUsed, unitLabel(c.unit))}
                  </span>
                </span>
                <span className="font-medium">{formatNaira(c.lineCost)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {batch.notes ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">Notes</p>
            <p className="text-sm">{batch.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <Link
        href={`/products/${batch.product.id}`}
        className="text-muted-foreground block text-center text-sm"
      >
        View {batch.product.name}
      </Link>
    </div>
  );
}
