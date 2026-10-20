import Link from "next/link";
import { AlertTriangle, ChevronRight, Plus, Wheat } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatQty } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { listRawMaterials } from "@/server/services/raw-materials";

export default async function RawMaterialsPage() {
  const materials = await listRawMaterials();

  const lowStockCount = materials.filter((m) => m.isLow).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Raw Materials & Ingredients"
        subtitle="Track bulk spices, herbs, packaging supplies, and reorder levels"
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="gap-1.5 shadow-2xs">
              <Link href="/purchases/new">
                <span>+ Log Purchase</span>
              </Link>
            </Button>
            <Button asChild className="gap-2 shadow-xs">
              <Link href="/raw-materials/new">
                <Plus className="size-4" />
                <span>Add Material</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Materials Tracked
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1">{materials.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <p
              className={`text-xl sm:text-2xl font-bold mt-1 ${
                lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {lowStockCount}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Inventory State
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-success">
              {lowStockCount === 0 ? "Fully Stocked" : "Reorder Needed"}
            </p>
          </CardContent>
        </Card>
      </div>

      {materials.length === 0 ? (
        <EmptyState
          title="No materials logged yet"
          hint="Add the raw spices, seasonings, jars, and pouches you buy before producing batches."
          action={
            <Button asChild>
              <Link href="/raw-materials/new">
                <Plus className="size-4 mr-2" />
                <span>Add First Material</span>
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden border border-border/80 shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Material Name</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Unit of Measure</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Quantity on Hand</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Stock Status</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-sm">
                      <Link
                        href={`/raw-materials/${m.id}`}
                        className="hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <Wheat className="size-4 text-chart-3" />
                        <span>{m.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {unitLabel(m.unit)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold tabular-nums">
                      {formatQty(m.quantityOnHand, unitLabel(m.unit))}
                    </TableCell>
                    <TableCell>
                      {m.isLow ? (
                        <Badge variant="destructive" className="text-[10px] uppercase gap-1 py-0 px-1.5">
                          <AlertTriangle className="size-3" />
                          <span>Reorder Now</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                          Healthy Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                        <Link href={`/raw-materials/${m.id}`}>
                          <span>View History</span>
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-border/60">
            {materials.map((m) => (
              <Link
                key={m.id}
                href={`/raw-materials/${m.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-sm truncate block">{m.name}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    {formatQty(m.quantityOnHand, unitLabel(m.unit))} in stock
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {m.isLow ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Low
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{unitLabel(m.unit)}</span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
