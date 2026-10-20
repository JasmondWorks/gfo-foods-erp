import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Layers, Pencil, Plus, ShoppingBag } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNaira, formatQty } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { getProduct } from "@/server/services/products";
import { getRecipe } from "@/server/services/recipes";
import { DeleteProduct } from "./delete-product";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, recipe] = await Promise.all([getProduct(id), getRecipe(id)]);
  if (!product) notFound();

  const isLow =
    product.reorderThreshold > 0 && product.quantityOnHand <= product.reorderThreshold;

  const marginPercent =
    product.sellingPrice > 0 && product.marginPerUnit !== null
      ? Math.round((product.marginPerUnit / product.sellingPrice) * 100)
      : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={product.name}
        subtitle={product.packageSize ? `Packaged variant: ${product.packageSize}` : "Standard product"}
        backHref="/products"
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-2xs">
              <Link href={`/products/${product.id}/edit`}>
                <Pencil className="size-3.5" />
                <span>Edit Product</span>
              </Link>
            </Button>
            {recipe && (
              <Button asChild size="sm" className="gap-1.5 shadow-xs">
                <Link href={`/batches/new?productId=${product.id}`}>
                  <Plus className="size-3.5" />
                  <span>Produce Batch</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Primary Financial & Stock KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              In Stock
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={`text-xl sm:text-2xl font-bold ${isLow ? "text-destructive" : ""}`}>
                {formatQty(product.quantityOnHand)}
              </p>
              <span className="text-xs text-muted-foreground">units</span>
            </div>
            {isLow && (
              <Badge variant="destructive" className="mt-2 text-[10px] gap-1">
                <AlertTriangle className="size-3" />
                <span>Below reorder limit</span>
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Retail Price
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground">
              {formatNaira(product.sellingPrice)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">per unit</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Material Cost
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground">
              {product.costPerUnit !== null ? formatNaira(product.costPerUnit) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">computed from recipe</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Unit Margin
              </p>
              {marginPercent !== null && (
                <Badge
                  variant={marginPercent >= 0 ? "secondary" : "destructive"}
                  className="text-[10px]"
                >
                  {marginPercent}%
                </Badge>
              )}
            </div>
            <p
              className={`text-xl sm:text-2xl font-bold mt-1 ${
                product.marginPerUnit !== null && product.marginPerUnit < 0
                  ? "text-destructive"
                  : "text-success"
              }`}
            >
              {product.marginPerUnit !== null ? formatNaira(product.marginPerUnit) : "No Recipe"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">profit per unit sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Responsive 2-Column Layout on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recipe & Formula Breakdown (lg: 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Production Recipe Formula</CardTitle>
                <CardDescription className="text-xs">
                  Raw ingredients and packaging automatically deducted during production
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/products/${product.id}/recipe`}>{recipe ? "Edit Recipe" : "Set Recipe"}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {!recipe ? (
                <EmptyState
                  title="No recipe formula attached yet"
                  hint="Attach a recipe with raw materials to allow batch production and real-time profit tracking."
                  action={
                    <Button asChild size="sm">
                      <Link href={`/products/${product.id}/recipe`}>
                        <Plus className="size-4 mr-1.5" />
                        <span>Add Formula</span>
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border text-xs">
                    <span className="font-medium text-foreground">Standard Batch Production Yield</span>
                    <span className="font-bold text-primary">
                      {formatQty(recipe.yieldQty, unitLabel(recipe.yieldUnit))}
                    </span>
                  </div>

                  <ul className="divide-y divide-border/60">
                    {recipe.ingredients.map((ing) => (
                      <li key={ing.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <span className="font-medium block text-foreground">{ing.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {formatQty(ing.quantity, unitLabel(ing.unit))} per batch
                          </span>
                        </div>
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatNaira(ing.lineCost)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-center border-t pt-3 text-sm">
                    <span className="font-medium text-muted-foreground">Total Material Cost per Batch</span>
                    <span className="font-bold text-foreground">
                      {formatNaira(recipe.ingredients.reduce((sum, i) => sum + i.lineCost, 0))}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Batches & Recent Sales (lg: 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Batches */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="size-4 text-chart-2" />
                <span>Recent Production Runs</span>
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/batches">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {product.batches.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  No batches produced for this product yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {product.batches.map((b) => (
                    <li key={b.id} className="flex justify-between items-center py-2.5 text-xs">
                      <div>
                        <Link href={`/batches/${b.id}`} className="font-semibold hover:text-primary transition-colors block">
                          {b.batchNumber}
                        </Link>
                        <span className="text-muted-foreground">
                          {formatDate(b.producedAt)}
                        </span>
                      </div>
                      <Badge variant="secondary" className="font-medium">
                        +{formatQty(b.quantityMade)} units
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingBag className="size-4 text-primary" />
                <span>Recent Sales History</span>
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/sales">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {product.saleItems.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  No sales recorded for this product yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {product.saleItems.map((s) => (
                    <li key={s.id} className="flex justify-between items-center py-2.5 text-xs">
                      <div>
                        <span className="font-semibold block text-foreground">
                          {formatQty(s.quantity)} units sold
                        </span>
                        <span className="text-muted-foreground">
                          {formatDate(s.saleDate)}
                        </span>
                      </div>
                      <span className="font-bold tabular-nums text-foreground">
                        {formatNaira(s.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Delete Danger Zone */}
          <div className="pt-2">
            <DeleteProduct id={product.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
