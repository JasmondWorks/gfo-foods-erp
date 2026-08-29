import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Phase 3 fills this in with alerts, month summary and recent activity.
// The quick-entry buttons are the reason this screen exists, so they ship first.
const QUICK_ENTRY = [
  { href: "/sales/new", label: "+ Sale" },
  { href: "/purchases/new", label: "+ Purchase" },
  { href: "/batches/new", label: "+ Batch" },
  { href: "/expenses/new", label: "+ Expense" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            This month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Revenue, expenses and estimated profit appear here once you start logging sales.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
