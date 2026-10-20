import Link from "next/link";
import { AlertTriangle, ChevronRight, Package, Plus } from "lucide-react";
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
import { formatNaira, formatQty } from "@/lib/format";
import { listProducts } from "@/server/services/products";

export default async function ProductsPage() {
  const products = await listProducts();

  const lowStockCount = products.filter((p) => p.isLow).length;
  const noRecipeCount = products.filter((p) => !p.hasRecipe).length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.quantityOnHand, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Products Catalog"
        subtitle="Manage finished packaged goods, selling prices, and recipe formulas"
        action={
          <Button asChild className="gap-2 shadow-xs">
            <Link href="/products/new">
              <Plus className="size-4" />
              <span>Add Product</span>
            </Link>
          </Button>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Products
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1">{products.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Finished Units
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-1">{formatQty(totalStockUnits)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Low Stock Alerts
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
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pending Recipe
            </span>
            <p
              className={`text-xl sm:text-2xl font-bold mt-1 ${
                noRecipeCount > 0 ? "text-warning" : "text-muted-foreground"
              }`}
            >
              {noRecipeCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          hint="Add the finished spice products you sell, attach recipes to them, and log production batches."
          action={
            <Button asChild>
              <Link href="/products/new">
                <Plus className="size-4 mr-2" />
                <span>Add First Product</span>
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
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Product Name</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Package Size</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Selling Price</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">In Stock</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Recipe Status</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-sm">
                      <Link
                        href={`/products/${p.id}`}
                        className="hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <Package className="size-4 text-muted-foreground" />
                        <span>{p.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.packageSize ?? "Standard"}
                    </TableCell>
                    <TableCell className="text-sm font-semibold tabular-nums">
                      {formatNaira(p.sellingPrice)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium tabular-nums ${
                            p.isLow ? "text-destructive font-bold" : "text-foreground"
                          }`}
                        >
                          {formatQty(p.quantityOnHand)} units
                        </span>
                        {p.isLow && (
                          <Badge variant="destructive" className="text-[10px] uppercase gap-1 py-0 px-1.5">
                            <AlertTriangle className="size-3" />
                            <span>Low</span>
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.hasRecipe ? (
                        <Badge variant="secondary" className="text-[11px] font-normal text-muted-foreground">
                          Formula Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] border-warning/40 text-warning bg-warning/5">
                          Missing Recipe
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                        <Link href={`/products/${p.id}`}>
                          <span>View Details</span>
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
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{p.name}</span>
                    {p.packageSize && (
                      <span className="text-xs text-muted-foreground font-normal">
                        · {p.packageSize}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className={p.isLow ? "text-destructive font-semibold" : ""}>
                      {formatQty(p.quantityOnHand)} in stock
                    </span>
                    <span>·</span>
                    <span className="font-medium text-foreground">{formatNaira(p.sellingPrice)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!p.hasRecipe && (
                    <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                      No recipe
                    </Badge>
                  )}
                  {p.isLow && (
                    <Badge variant="destructive" className="text-[10px]">
                      Low
                    </Badge>
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
