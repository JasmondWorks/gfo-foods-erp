import Link from "next/link";
import {
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toNumber } from "@/lib/decimal";
import { formatNaira, formatQty } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getMonthSummary } from "@/server/services/dashboard";

export default async function ReportsPage() {
  const [summary, products, expenses, topSales] = await Promise.all([
    getMonthSummary(),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        packageSize: true,
        quantityOnHand: true,
        sellingPrice: true,
        saleItems: { select: { quantity: true, lineTotal: true } },
      },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
  ]);

  const expenseBreakdown = expenses.map((e) => ({
    name: e.category,
    amount: e._sum && e._sum.amount ? toNumber(e._sum.amount) : 0,
  }));

  const productMap = new Map(products.map((p) => [p.id, p]));
  const topPerformers = topSales.map((ts) => {
    const prod = productMap.get(ts.productId);
    return {
      id: ts.productId,
      name: prod?.name ?? "Unknown",
      packageSize: prod?.packageSize ?? "",
      unitsSold: toNumber(ts._sum.quantity ?? 0),
      revenue: toNumber(ts._sum.lineTotal ?? 0),
    };
  });

  const totalFinishedGoodsValue = products.reduce(
    (acc, p) => acc + toNumber(p.quantityOnHand) * toNumber(p.sellingPrice),
    0,
  );

  const profitMargin =
    summary.revenue > 0 ? Math.round((summary.profit / summary.revenue) * 100) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Business Reports & Analytics"
        subtitle="Operational metrics, profit margins, product sales rankings, and expense allocation"
        action={
          <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-2xs">
            <Link href="/sales">
              <ShoppingBag className="size-4" />
              <span>Sales Ledger</span>
            </Link>
          </Button>
        }
      />

      {/* Financial Health Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Revenue (Month)
            </CardTitle>
            <TrendingUp className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatNaira(summary.revenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total billing invoiced</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Operating Expenses
            </CardTitle>
            <Receipt className="size-4 text-warning" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatNaira(summary.expenses)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Overhead & transport</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estimated Net Profit
            </CardTitle>
            {profitMargin !== null && (
              <Badge variant={profitMargin >= 0 ? "secondary" : "destructive"} className="text-[10px]">
                {profitMargin}%
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold tracking-tight ${
                summary.profit < 0 ? "text-destructive" : "text-success"
              }`}
            >
              {formatNaira(summary.profit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">After COGS & expenses</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Finished Goods Stock Value
            </CardTitle>
            <Package className="size-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatNaira(totalFinishedGoodsValue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Retail value on shelf</p>
          </CardContent>
        </Card>
      </div>

      {/* Responsive 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Top Selling Products (lg: 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Top Performing Spice Blends</CardTitle>
                <CardDescription className="text-xs">
                  Highest volume and revenue contributors
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/products">All Products</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {topPerformers.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No sales recorded yet to generate product rankings.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold text-xs">Product</TableHead>
                        <TableHead className="font-semibold text-xs">Units Sold</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Total Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPerformers.map((tp) => (
                        <TableRow key={tp.id}>
                          <TableCell className="font-medium text-sm">
                            <Link href={`/products/${tp.id}`} className="hover:text-primary transition-colors">
                              {tp.name}
                              {tp.packageSize ? (
                                <span className="text-xs text-muted-foreground font-normal">
                                  {" "}· {tp.packageSize}
                                </span>
                              ) : null}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">
                            {formatQty(tp.unitsSold)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold tabular-nums">
                            {formatNaira(tp.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Expense Category Allocation (lg: 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="size-4 text-warning" />
                <span>Expense Cost Allocation</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Operating expenditure breakdown by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expenseBreakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No expenses logged yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {expenseBreakdown.map((eb) => {
                    const percent =
                      summary.expenses > 0
                        ? Math.round((eb.amount / summary.expenses) * 100)
                        : 0;
                    return (
                      <li key={eb.name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-foreground">{eb.name}</span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatNaira(eb.amount)} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
