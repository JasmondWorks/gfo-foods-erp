import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Layers, Pencil, Plus, ShoppingCart } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={material.name}
        subtitle={`Tracked in ${unit} · Reorder threshold: ${formatQty(material.reorderThreshold, unit)}`}
        backHref="/raw-materials"
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-2xs">
              <Link href={`/raw-materials/${material.id}/edit`}>
                <Pencil className="size-3.5" />
                <span>Edit</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5 shadow-xs">
              <Link href={`/purchases/new?rawMaterialId=${material.id}`}>
                <Plus className="size-3.5" />
                <span>Buy More</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Quantity on Hand
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={`text-xl sm:text-2xl font-bold ${isLow ? "text-destructive" : ""}`}>
                {formatQty(material.quantityOnHand, unit)}
              </p>
            </div>
            {isLow && (
              <Badge variant="destructive" className="mt-2 text-[10px] gap-1">
                <AlertTriangle className="size-3" />
                <span>Reorder threshold breached</span>
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Weighted Average Cost
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground">
              {formatNaira(material.averageCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">per {unit}</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Total Inflow Value
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-chart-3">
              {formatNaira(material.averageCost * material.quantityOnHand)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">current stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Responsive 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Purchase Receipts (lg: 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShoppingCart className="size-4 text-chart-3" />
                  <span>Procurement History</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Recent supplier purchases and invoices logged for this ingredient
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/purchases/new?rawMaterialId=${material.id}`}>
                  <Plus className="size-3.5 mr-1" />
                  <span>Log Purchase</span>
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {material.purchases.length === 0 ? (
                <EmptyState title="No purchases recorded yet" />
              ) : (
                <ul className="divide-y divide-border/60">
                  {material.purchases.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <span className="font-semibold block text-foreground">
                          {formatQty(p.quantity, unit)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(p.purchasedAt)}
                          {p.supplier ? ` · Supplier: ${p.supplier}` : ""}
                        </span>
                      </div>
                      <span className="font-bold tabular-nums text-foreground">
                        {formatNaira(p.totalCost)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Production Batch Consumptions (lg: 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="size-4 text-chart-2" />
                <span>Production Run Deductions</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Batches where this material was consumed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {material.batchConsumptions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Not consumed in any logged batches yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {material.batchConsumptions.map((c) => (
                    <li key={c.id} className="flex justify-between items-center py-2.5 text-xs">
                      <div>
                        <Link
                          href={`/batches/${c.batchId}`}
                          className="font-semibold hover:text-primary transition-colors block"
                        >
                          {c.batch.batchNumber}
                        </Link>
                        <span className="text-muted-foreground">
                          {formatDate(c.batch.producedAt)}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-medium text-destructive border-destructive/20">
                        -{formatQty(c.quantityUsed, unit)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Delete Danger Zone */}
          <div className="pt-2">
            <DeleteRawMaterial id={material.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
