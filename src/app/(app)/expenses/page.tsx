import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
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
import { listExpenses } from "@/server/services/expenses";

export default async function ExpensesPage() {
  const expenses = await listExpenses();

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Business Expenses"
        subtitle="Track logistics, packaging overheads, utilities, and generator costs"
        action={
          <Button asChild className="gap-2 shadow-xs">
            <Link href="/expenses/new">
              <Plus className="size-4" />
              <span>Record Expense</span>
            </Link>
          </Button>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Expenses Logged
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1">{expenses.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cumulative Expense Total
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-warning">
              {formatNaira(totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Overhead Ledger
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1">Deducted from Profit</p>
          </CardContent>
        </Card>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses logged yet"
          hint="Track every transport fee, market delivery, fuel, and packaging purchase to know your real net profit."
          action={
            <Button asChild>
              <Link href="/expenses/new">
                <Plus className="size-4 mr-2" />
                <span>Record First Expense</span>
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
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Category</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Notes / Memo</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        <Receipt className="size-4 text-warning" />
                        <Badge variant="outline" className="font-medium text-foreground">
                          {e.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {e.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(e.date)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold tabular-nums">
                      {formatNaira(e.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-border/60">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <span className="font-semibold text-sm truncate block">{e.category}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    {formatDate(e.date)}
                    {e.notes ? ` · ${e.notes}` : ""}
                  </span>
                </div>
                <span className="font-bold text-sm tabular-nums shrink-0">
                  {formatNaira(e.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
