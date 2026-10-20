import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Package,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { EmptyState } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira, relativeDays } from "@/lib/format";
import { getAlerts, getMonthSummary, getRecentActivity } from "@/server/services/dashboard";

const QUICK_ACTIONS = [
  {
    href: "/sales/new",
    label: "New Sale",
    description: "Retail or wholesale order",
    icon: ShoppingBag,
    color: "bg-primary/10 text-primary border-primary/20 hover:border-primary/50 hover:bg-primary/15",
  },
  {
    href: "/batches/new",
    label: "Production Batch",
    description: "Produce spices from recipe",
    icon: Layers,
    color: "bg-chart-2/15 text-chart-2 border-chart-2/30 hover:border-chart-2/60 hover:bg-chart-2/20",
  },
  {
    href: "/purchases/new",
    label: "Raw Purchase",
    description: "Replenish materials & spices",
    icon: ShoppingCart,
    color: "bg-chart-3/15 text-chart-3 border-chart-3/30 hover:border-chart-3/60 hover:bg-chart-3/20",
  },
  {
    href: "/expenses/new",
    label: "Record Expense",
    description: "Transport, packaging & bills",
    icon: Receipt,
    color: "bg-warning/15 text-warning border-warning/30 hover:border-warning/60 hover:bg-warning/20",
  },
];

export default async function DashboardPage() {
  const [alerts, summary, activity] = await Promise.all([
    getAlerts(),
    getMonthSummary(),
    getRecentActivity(10),
  ]);

  const profitMargin =
    summary.revenue > 0 ? Math.round((summary.profit / summary.revenue) * 100) : null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome / Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Overview & Operations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time food production, inventory status, and automated financial tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activity.lastEntryAt ? (
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${
                activity.isStale
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              <Clock className="size-3.5" />
              <span>Last entry: {relativeDays(activity.lastEntryAt)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Quick Entry Actions Row */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h2>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Directly logs transactions in &lt; 20 seconds
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 active:scale-98 shadow-xs hover:shadow-md ${item.color}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-lg bg-background/80 shadow-xs">
                    <Icon className="size-5 shrink-0" />
                  </div>
                  <ArrowUpRight className="size-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4">
                  <span className="block font-semibold text-sm sm:text-base text-foreground">
                    {item.label}
                  </span>
                  <span className="hidden sm:block text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Metric Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Revenue */}
        <Card className="shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              This Month Revenue
            </CardTitle>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatNaira(summary.revenue)}
            </div>
            <p className="text-muted-foreground text-xs mt-1">Total completed sales</p>
          </CardContent>
        </Card>

        {/* Metric 2: Expenses */}
        <Card className="shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              This Month Expenses
            </CardTitle>
            <div className="size-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
              <Receipt className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatNaira(summary.expenses)}
            </div>
            <p className="text-muted-foreground text-xs mt-1">Operational & overhead costs</p>
          </CardContent>
        </Card>

        {/* Metric 3: Estimated Net Profit */}
        <Card className="shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estimated Net Profit
            </CardTitle>
            {profitMargin !== null && (
              <Badge
                variant={profitMargin >= 0 ? "secondary" : "destructive"}
                className="text-[11px] font-semibold"
              >
                {profitMargin}% margin
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold tracking-tight ${
                summary.profit < 0 ? "text-destructive" : "text-success"
              }`}
            >
              {formatNaira(summary.profit)}
            </div>
            <p className="text-muted-foreground text-xs mt-1">Revenue − (COGS + Expenses)</p>
          </CardContent>
        </Card>

        {/* Metric 4: Inventory & Health Alerts */}
        <Card className="shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stock Health
            </CardTitle>
            <div
              className={`size-8 rounded-lg flex items-center justify-center ${
                alerts.length > 0
                  ? "bg-warning/15 text-warning"
                  : "bg-success/15 text-success"
              }`}
            >
              {alerts.length > 0 ? (
                <AlertTriangle className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {alerts.length > 0 ? `${alerts.length} Warnings` : "Optimal"}
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              {alerts.length > 0
                ? "Items require reorder or attention"
                : "All stock within safe thresholds"}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Grid: 2 columns on desktop (Activity on left, Alerts & Quick Nav on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Section (lg: 8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Ledger Activity</CardTitle>
                <CardDescription className="text-xs">
                  Latest recorded entries across sales, batches, purchases, and expenses
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
                <Link href="/sales">
                  <span>View Sales</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {activity.items.length === 0 ? (
                <EmptyState
                  title="No entries logged yet"
                  hint="Log a sale or a purchase to initialize your business ledger."
                />
              ) : (
                <ul className="divide-y divide-border/60">
                  {activity.items.map((item) => {
                    const badgeConfig = {
                      sale: {
                        label: "Sale",
                        icon: ShoppingBag,
                        color: "text-primary bg-primary/10 border-primary/20",
                      },
                      purchase: {
                        label: "Purchase",
                        icon: ShoppingCart,
                        color: "text-chart-3 bg-chart-3/10 border-chart-3/20",
                      },
                      batch: {
                        label: "Batch",
                        icon: Layers,
                        color: "text-chart-2 bg-chart-2/10 border-chart-2/20",
                      },
                      expense: {
                        label: "Expense",
                        icon: Receipt,
                        color: "text-warning bg-warning/10 border-warning/20",
                      },
                    }[item.kind];

                    const Icon = badgeConfig.icon;

                    return (
                      <li key={`${item.kind}-${item.id}`}>
                        <Link
                          href={item.href}
                          className="flex items-center justify-between gap-4 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${badgeConfig.color}`}
                            >
                              <Icon className="size-4.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="block truncate font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                {item.label}
                              </span>
                              <span className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5">
                                <span className="capitalize">{badgeConfig.label}</span>
                                <span>·</span>
                                <span>{relativeDays(item.at)}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.amount !== null ? (
                              <span
                                className={`font-semibold text-sm sm:text-base tabular-nums ${
                                  item.kind === "sale"
                                    ? "text-success"
                                    : item.kind === "expense" || item.kind === "purchase"
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {item.kind === "sale" ? "+" : ""}
                                {formatNaira(item.amount)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Production Run
                              </span>
                            )}
                            <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right / Secondary Section (lg: 4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Needs Attention Card */}
          <Card className={alerts.length > 0 ? "border-warning/40 shadow-xs" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle
                    className={`size-4 ${
                      alerts.length > 0 ? "text-warning" : "text-muted-foreground"
                    }`}
                  />
                  <span>Action Items</span>
                </CardTitle>
                <Badge
                  variant={alerts.length > 0 ? "destructive" : "secondary"}
                  className="text-[11px]"
                >
                  {alerts.length}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Inventory thresholds, expirations & outstanding bills
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="py-4 text-center">
                  <CheckCircle2 className="size-8 text-success mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-medium">All systems healthy</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No low stock, expiring batches, or aged unpaid sales.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {alerts.slice(0, 5).map((alert) => (
                    <li key={`${alert.kind}-${alert.href}-${alert.message}`}>
                      <Link
                        href={alert.href}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg border border-warning/20 bg-warning/5 hover:bg-warning/10 text-xs font-medium transition-colors"
                      >
                        <span className="truncate text-foreground">{alert.message}</span>
                        <ChevronRight className="size-3.5 text-warning shrink-0" />
                      </Link>
                    </li>
                  ))}
                  {alerts.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{alerts.length - 5} additional items pending
                    </p>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Quick Inventory Navigation Tile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Inventory Shortcuts</CardTitle>
              <CardDescription className="text-xs">
                Manage your finished goods and raw ingredients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/products"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Package className="size-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium block">Finished Products</span>
                    <span className="text-xs text-muted-foreground">Catalog, pricing & recipes</span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground" />
              </Link>

              <Link
                href="/raw-materials"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-chart-3/10 text-chart-3 flex items-center justify-center">
                    <Wheat className="size-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium block">Raw Materials</span>
                    <span className="text-xs text-muted-foreground">Bulk spices & packaging stock</span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
