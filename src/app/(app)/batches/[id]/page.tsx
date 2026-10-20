import Link from "next/link";
import { notFound } from "next/navigation";
import { Package, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNaira, formatQty } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { getBatch } from "@/server/services/batches";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batch = await getBatch(id);
  if (!batch) notFound();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={`Batch ${batch.batchNumber}`}
        subtitle={`Produced product: ${batch.product.name}`}
        backHref="/batches"
        action={
          <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-2xs">
            <Link href={`/products/${batch.product.id}`}>
              <Package className="size-4" />
              <span>View Product Profile</span>
            </Link>
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Quantity Produced
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-chart-2">
              +{formatQty(batch.quantityMade)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">units produced</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Unit Cost
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground">
              {formatNaira(batch.unitCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">per unit</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Total Production Cost
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground">
              {formatNaira(batch.totalCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">materials consumed</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Production Date
            </p>
            <p className="text-sm sm:text-base font-bold mt-1 text-foreground">
              {formatDate(batch.producedAt)}
            </p>
            {batch.expiryDate ? (
              <Badge variant="outline" className="mt-2 text-[10px] text-muted-foreground">
                Expires {formatDate(batch.expiryDate)}
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No expiry date</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Responsive 2-Column Traceability Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Bill of Materials Consumed (lg: 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-success" />
                  <span>Exact Material Traceability & Deductions</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Locked historical snapshot of ingredients and costs consumed in this specific production run
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border/60">
                {batch.consumptions.map((c) => (
                  <li key={c.id} className="flex justify-between items-center py-3 text-sm">
                    <div>
                      <span className="font-semibold block text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatQty(c.quantityUsed, unitLabel(c.unit))} consumed
                      </span>
                    </div>
                    <span className="font-bold tabular-nums text-foreground">
                      {formatNaira(c.lineCost)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center border-t pt-3 mt-2 text-sm font-semibold">
                <span>Total Materials Incurred</span>
                <span className="tabular-nums">{formatNaira(batch.totalCost)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Notes & Meta (lg: 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Batch Run Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Product</span>
                <span className="font-semibold text-sm text-foreground">{batch.product.name}</span>
              </div>
              <div className="border-t pt-2">
                <span className="text-muted-foreground block">Batch Identifier</span>
                <span className="font-mono font-medium text-foreground">{batch.batchNumber}</span>
              </div>
              {batch.notes ? (
                <div className="border-t pt-2">
                  <span className="text-muted-foreground block mb-1">Production Notes</span>
                  <p className="p-2.5 rounded-lg bg-muted/50 border text-foreground leading-relaxed">
                    {batch.notes}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
