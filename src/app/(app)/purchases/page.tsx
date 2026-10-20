import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
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
import { formatDate, formatNaira, formatQty } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { listPurchases } from "@/server/services/purchases";

export default async function PurchasesPage() {
  const purchases = await listPurchases();

  const totalSpent = purchases.reduce((sum, p) => sum + p.totalCost, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Raw Material Purchases"
        subtitle="Log bulk spices and packaging supply receipts to automatically update stock & weighted costs"
        action={
          <Button asChild className="gap-2 shadow-xs">
            <Link href="/purchases/new">
              <Plus className="size-4" />
              <span>Log Purchase</span>
            </Link>
          </Button>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Invoices Logged
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1">{purchases.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Procurement Cost
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1">{formatNaira(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Stock Inflow Status
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-chart-3">Active Sourcing</p>
          </CardContent>
        </Card>
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          title="No purchases logged yet"
          hint="When you buy bulk pepper, ginger, garlic, or jars, log them here to feed the production engine."
          action={
            <Button asChild>
              <Link href="/purchases/new">
                <Plus className="size-4 mr-2" />
                <span>Log First Purchase</span>
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
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Material</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Quantity</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Supplier</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="size-4 text-chart-3" />
                        <span>{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {formatQty(p.quantity, unitLabel(p.unit))}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.supplier ?? "Market / Direct"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(p.purchasedAt)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold tabular-nums">
                      {formatNaira(p.totalCost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-border/60">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <span className="font-semibold text-sm truncate block">{p.name}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    {formatQty(p.quantity, unitLabel(p.unit))} · {formatDate(p.purchasedAt)}
                    {p.supplier ? ` · ${p.supplier}` : ""}
                  </span>
                </div>
                <span className="font-bold text-sm tabular-nums shrink-0">
                  {formatNaira(p.totalCost)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
