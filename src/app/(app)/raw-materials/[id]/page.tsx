import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNaira, formatQty } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { getRawMaterial } from "@/server/services/raw-materials";
import { DeleteRawMaterial } from "./delete-raw-material";

export default async function RawMaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const material = await getRawMaterial(id);
  if (!material) notFound();

  const unit = unitLabel(material.unit);
  const isLow = material.reorderThreshold > 0 && material.quantityOnHand <= material.reorderThreshold;

  return (
    <div className="space-y-5">
      <PageHeader
        title={material.name}
        backHref="/raw-materials"
        action={
          <Button asChild variant="outline" size="icon" aria-label="Edit material">
            <Link href={`/raw-materials/${material.id}/edit`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">In stock</p>
            <p className={`text-lg font-semibold ${isLow ? "text-destructive" : ""}`}>
              {formatQty(material.quantityOnHand, unit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">Average cost</p>
            <p className="text-lg font-semibold">
              {formatNaira(material.averageCost)}
              <span className="text-muted-foreground text-xs"> /{unit}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {material.purchases.length === 0 ? (
            <EmptyState title="No purchases logged yet" />
          ) : (
            <ul className="divide-y">
              {material.purchases.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="block">{formatQty(p.quantity, unit)}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(p.purchasedAt)}
                      {p.supplier ? ` · ${p.supplier}` : ""}
                    </span>
                  </span>
                  <span className="font-medium">{formatNaira(p.totalCost)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Used in production</CardTitle>
        </CardHeader>
        <CardContent>
          {material.batchConsumptions.length === 0 ? (
            <EmptyState title="Not used in a batch yet" />
          ) : (
            <ul className="divide-y">
              {material.batchConsumptions.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="block">{c.batch.batchNumber}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(c.batch.producedAt)}
                    </span>
                  </span>
                  <span className="font-medium">−{formatQty(c.quantityUsed, unit)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <DeleteRawMaterial id={material.id} />
    </div>
  );
}
