import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-5">
      <PageHeader
        title={product.name}
        subtitle={product.packageSize ?? undefined}
        backHref="/products"
        action={
          <Button asChild variant="outline" size="icon" aria-label="Edit product">
            <Link href={`/products/${product.id}/edit`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">In stock</p>
            <p className={`text-lg font-semibold ${isLow ? "text-destructive" : ""}`}>
              {formatQty(product.quantityOnHand)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs uppercase">Sells for</p>
            <p className="text-lg font-semibold">{formatNaira(product.sellingPrice)}</p>
          </CardContent>
        </Card>
      </div>

      {/* The "am I actually making money on this?" answer (BUILD_SPEC §3.5). */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Profit per unit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          {product.costPerUnit === null || product.marginPerUnit === null ? (
            <p className="text-muted-foreground">
              Set a recipe to see what this product costs to make.
            </p>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material cost</span>
                <span className="font-medium">{formatNaira(product.costPerUnit)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5">
                <span className="text-muted-foreground">Margin</span>
                <span
                  className={`font-semibold ${
                    product.marginPerUnit < 0 ? "text-destructive" : "text-success"
                  }`}
                >
                  {formatNaira(product.marginPerUnit)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Recipe</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href={`/products/${product.id}/recipe`}>{recipe ? "Edit" : "Set recipe"}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!recipe ? (
            <EmptyState
              title="No recipe yet"
              hint="Without a recipe this product can't be produced in a batch."
            />
          ) : (
            <>
              <p className="text-muted-foreground mb-2 text-xs">
                One batch yields {formatQty(recipe.yieldQty, unitLabel(recipe.yieldUnit))}
              </p>
              <ul className="divide-y">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id} className="flex justify-between py-2 text-sm">
                    <span>
                      <span className="block">{ing.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatQty(ing.quantity, unitLabel(ing.unit))}
                      </span>
                    </span>
                    <span className="font-medium">{formatNaira(ing.lineCost)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent batches</CardTitle>
        </CardHeader>
        <CardContent>
          {product.batches.length === 0 ? (
            <EmptyState title="No batches yet" />
          ) : (
            <ul className="divide-y">
              {product.batches.map((b) => (
                <li key={b.id} className="flex justify-between py-2 text-sm">
                  <span>
                    <span className="block">{b.batchNumber}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(b.producedAt)}
                    </span>
                  </span>
                  <span className="font-medium">+{formatQty(b.quantityMade)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent sales</CardTitle>
        </CardHeader>
        <CardContent>
          {product.saleItems.length === 0 ? (
            <EmptyState title="No sales yet" />
          ) : (
            <ul className="divide-y">
              {product.saleItems.map((s) => (
                <li key={s.id} className="flex justify-between py-2 text-sm">
                  <span>
                    <span className="block">{formatQty(s.quantity)} sold</span>
                    <span className="text-muted-foreground text-xs">{formatDate(s.saleDate)}</span>
                  </span>
                  <span className="font-medium">{formatNaira(s.lineTotal)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <DeleteProduct id={product.id} />
    </div>
  );
}
