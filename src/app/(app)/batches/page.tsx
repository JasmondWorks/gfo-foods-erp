import Link from "next/link";
import { AlertTriangle, ChevronRight, Layers, Plus } from "lucide-react";
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
import { formatDate, formatQty } from "@/lib/format";
import { listBatches } from "@/server/services/batches";

export default async function BatchesPage() {
  const batches = await listBatches();

  const expiringCount = batches.filter(
    (b) => b.daysToExpiry !== null && b.daysToExpiry <= 30 && b.daysToExpiry >= 0,
  ).length;
  const expiredCount = batches.filter(
    (b) => b.daysToExpiry !== null && b.daysToExpiry < 0,
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Production Batches"
        subtitle="Track manufacturing runs, ingredient deductions, and batch expiration dates"
        action={
          <Button asChild className="gap-2 shadow-xs">
            <Link href="/batches/new">
              <Plus className="size-4" />
              <span>Log Batch</span>
            </Link>
          </Button>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Batches Run
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1">{batches.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Production
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-chart-2">
              {batches.filter((b) => b.daysToExpiry === null || b.daysToExpiry > 0).length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Expiring Soon (&le;30d)
            </span>
            <p
              className={`text-xl sm:text-2xl font-bold mt-1 ${
                expiringCount > 0 ? "text-warning" : "text-muted-foreground"
              }`}
            >
              {expiringCount}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Expired Batches
            </span>
            <p
              className={`text-xl sm:text-2xl font-bold mt-1 ${
                expiredCount > 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {expiredCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          title="No production batches logged yet"
          hint="Produce finished goods from your recipes. Raw materials will be deducted automatically."
          action={
            <Button asChild>
              <Link href="/batches/new">
                <Plus className="size-4 mr-2" />
                <span>Log First Batch</span>
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
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Batch Number</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Product</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Quantity Made</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Produced At</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Expiry Status</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => {
                  const days = b.daysToExpiry;
                  return (
                    <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-sm">
                        <Link
                          href={`/batches/${b.id}`}
                          className="hover:text-primary transition-colors flex items-center gap-2"
                        >
                          <Layers className="size-4 text-chart-2" />
                          <span>{b.batchNumber}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{b.productName}</TableCell>
                      <TableCell className="text-sm font-bold tabular-nums">
                        +{formatQty(b.quantityMade)} units
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(b.producedAt)}
                      </TableCell>
                      <TableCell>
                        {days === null ? (
                          <span className="text-xs text-muted-foreground">No expiry set</span>
                        ) : days < 0 ? (
                          <Badge variant="destructive" className="text-[10px] uppercase gap-1">
                            <AlertTriangle className="size-3" />
                            <span>Expired</span>
                          </Badge>
                        ) : days <= 30 ? (
                          <Badge variant="outline" className="text-[10px] text-warning border-warning/40 bg-warning/5">
                            Expires in {days}d
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                            {formatDate(b.expiryDate!)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                          <Link href={`/batches/${b.id}`}>
                            <span>View Run</span>
                            <ChevronRight className="size-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-border/60">
            {batches.map((b) => {
              const days = b.daysToExpiry;
              return (
                <Link
                  key={b.id}
                  href={`/batches/${b.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-sm truncate block">{b.productName}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      {b.batchNumber} · {formatQty(b.quantityMade)} made · {formatDate(b.producedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {days !== null && days <= 30 ? (
                      <Badge variant={days < 0 ? "destructive" : "secondary"} className="text-[10px]">
                        {days < 0 ? "Expired" : `${days}d`}
                      </Badge>
                    ) : null}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
