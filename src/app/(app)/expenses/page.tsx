import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { formatDate, formatNaira } from "@/lib/format";
import { listExpenses } from "@/server/services/expenses";

export default async function ExpensesPage() {
  const expenses = await listExpenses();

  return (
    <div>
      <PageHeader
        title="Expenses"
        action={
          <Button asChild size="icon" aria-label="Add expense">
            <Link href="/expenses/new">
              <Plus className="size-5" />
            </Link>
          </Button>
        }
      />

      {expenses.length === 0 ? (
        <EmptyState title="No expenses logged yet" />
      ) : (
        <ul className="divide-y rounded-xl border">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate font-medium">{e.category}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDate(e.date)}
                  {e.notes ? ` · ${e.notes}` : ""}
                </span>
              </span>
              <span className="shrink-0 font-medium">{formatNaira(e.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
