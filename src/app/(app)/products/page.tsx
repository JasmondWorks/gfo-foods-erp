import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira, formatQty } from "@/lib/format";
import { listProducts } from "@/server/services/products";

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} tracked`}
        action={
          <Button asChild size="icon" aria-label="New product">
            <Link href="/products/new">
              <Plus className="size-5" />
            </Link>
          </Button>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          hint="Add what you sell, give each one a recipe, then log batches against it."
        />
      ) : (
        <ul className="divide-y rounded-xl border">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/products/${p.id}`}
                className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {p.name}
                    {p.packageSize ? (
                      <span className="text-muted-foreground font-normal"> · {p.packageSize}</span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatQty(p.quantityOnHand)} in stock · {formatNaira(p.sellingPrice)}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1.5">
                  {!p.hasRecipe ? <Badge variant="outline">No recipe</Badge> : null}
                  {p.isLow ? <Badge variant="destructive">Low</Badge> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
