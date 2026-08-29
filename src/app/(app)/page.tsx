import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira, relativeDays } from "@/lib/format";
import { getAlerts, getMonthSummary, getRecentActivity } from "@/server/services/dashboard";

const QUICK_ENTRY = [
  { href: "/sales/new", label: "+ Sale" },
  { href: "/purchases/new", label: "+ Purchase" },
  { href: "/batches/new", label: "+ Batch" },
  { href: "/expenses/new", label: "+ Expense" },
];

export default async function DashboardPage() {
  const [alerts, summary, activity] = await Promise.all([
    getAlerts(),
    getMonthSummary(),
    getRecentActivity(),
  ]);

  return (
    <div className="space-y-6">
      {/* Quick entry first: this is what she opened the app to do. */}
      <section>
        <h1 className="sr-only">Dashboard</h1>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ENTRY.map((item) => (
            <Button key={item.href} asChild size="lg" className="h-14 w-full text-base">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </section>

      {alerts.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase">
            Needs attention
          </h2>
          <ul className="divide-y rounded-xl border">
            {alerts.slice(0, 6).map((alert) => (
              <li key={`${alert.kind}-${alert.href}-${alert.message}`}>
                <Link
                  href={alert.href}
                  className="flex min-h-12 items-center gap-2 px-3 py-2 text-sm"
                >
                  <AlertTriangle className="text-warning size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{alert.message}</span>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
          {alerts.length > 6 ? (
            <p className="text-muted-foreground text-xs">
              and {alerts.length - 6} more
            </p>
          ) : null}
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-xs font-semibold uppercase">
            This month
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revenue</span>
            <span className="font-medium">{formatNaira(summary.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expenses</span>
            <span className="font-medium">{formatNaira(summary.expenses)}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5 text-base">
            <span className="text-muted-foreground">Estimated profit</span>
            <span
              className={`font-semibold ${summary.profit < 0 ? "text-destructive" : "text-success"}`}
            >
              {formatNaira(summary.profit)}
            </span>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase">Recent</h2>
          {activity.lastEntryAt ? (
            <p className={`text-xs ${activity.isStale ? "text-warning" : "text-muted-foreground"}`}>
              Last entry {relativeDays(activity.lastEntryAt)}
            </p>
          ) : null}
        </div>

        {activity.items.length === 0 ? (
          <EmptyState
            title="Nothing logged yet"
            hint="Start with a sale or a purchase — the rest follows from there."
          />
        ) : (
          <ul className="divide-y rounded-xl border">
            {activity.items.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{item.label}</span>
                    <span className="text-muted-foreground text-xs capitalize">
                      {item.kind} · {relativeDays(item.at)}
                    </span>
                  </span>
                  {item.amount !== null ? (
                    <span className="shrink-0 font-medium">{formatNaira(item.amount)}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
