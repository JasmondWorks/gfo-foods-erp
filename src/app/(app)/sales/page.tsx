import Link from "next/link";
import { ChevronRight, Plus, ShoppingBag } from "lucide-react";
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
import { formatDate, formatNaira } from "@/lib/format";
import { listSales } from "@/server/services/sales";

export default async function SalesPage() {
  const sales = await listSales();

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const unpaidSales = sales.filter((s) => s.paymentStatus !== "PAID");
  const outstandingTotal = unpaidSales.reduce(
    (sum, s) => sum + (s.totalAmount - s.amountPaid),
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Sales Ledger"
        subtitle="Record retail orders, wholesale invoices, and customer credit"
        action={
          <Button asChild className="gap-2 shadow-xs">
            <Link href="/sales/new">
              <Plus className="size-4" />
              <span>Record Sale</span>
            </Link>
          </Button>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Transactions
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1">{sales.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Sales Volume
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-success">
              {formatNaira(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Unpaid / Partial
            </span>
            <p
              className={`text-xl sm:text-2xl font-bold mt-1 ${
                unpaidSales.length > 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {unpaidSales.length} orders
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Outstanding Credit
            </span>
            <p
              className={`text-xl sm:text-2xl font-bold mt-1 ${
                outstandingTotal > 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {formatNaira(outstandingTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {sales.length === 0 ? (
        <EmptyState
          title="No sales logged yet"
          hint="Start logging sales to update finished goods inventory and calculate your real profits."
          action={
            <Button asChild>
              <Link href="/sales/new">
                <Plus className="size-4 mr-2" />
                <span>Log First Sale</span>
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
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Customer</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Items</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Payment Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Total Amount</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-sm">
                      <Link
                        href={`/sales/${s.id}`}
                        className="hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <ShoppingBag className="size-4 text-primary" />
                        <span>{s.customerName ?? "Walk-in Customer"}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(s.saleDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.itemCount} item{s.itemCount !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      {s.paymentStatus === "PAID" ? (
                        <Badge variant="secondary" className="text-[11px] text-success bg-success/10 border-success/20">
                          Paid
                        </Badge>
                      ) : s.paymentStatus === "UNPAID" ? (
                        <Badge variant="destructive" className="text-[11px]">
                          Unpaid
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] text-warning border-warning/40 bg-warning/5">
                          Partial (Bal: {formatNaira(s.totalAmount - s.amountPaid)})
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-bold tabular-nums">
                      {formatNaira(s.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                        <Link href={`/sales/${s.id}`}>
                          <span>View Invoice</span>
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
            {sales.map((s) => (
              <Link
                key={s.id}
                href={`/sales/${s.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-sm truncate block">
                    {s.customerName ?? "Walk-in Customer"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    {formatDate(s.saleDate)} · {s.itemCount} item{s.itemCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span className="font-bold text-sm block tabular-nums">
                      {formatNaira(s.totalAmount)}
                    </span>
                    {s.paymentStatus !== "PAID" ? (
                      <Badge
                        variant={s.paymentStatus === "UNPAID" ? "destructive" : "secondary"}
                        className="text-[10px] mt-0.5"
                      >
                        {s.paymentStatus === "UNPAID" ? "Unpaid" : "Partial"}
                      </Badge>
                    ) : null}
                  </div>
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
