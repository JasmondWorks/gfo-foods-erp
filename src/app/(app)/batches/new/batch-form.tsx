"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { AlertTriangle, Check, ShieldCheck } from "lucide-react";
import { DateField, QuantityInput } from "@/components/common/entry-fields";
import { Field, FormMessage, SubmitButton } from "@/components/common/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatQty } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { createBatchAction, previewBatchAction } from "@/server/actions/entries";
import { EMPTY_FORM_STATE } from "@/server/validation/shared";

type Product = { id: string; name: string; packageSize: string | null };
type Preview = Awaited<ReturnType<typeof previewBatchAction>>;

export function BatchForm({ products }: { products: Product[] }) {
  const [state, formAction] = useActionState(createBatchAction, EMPTY_FORM_STATE);
  const [productId, setProductId] = useState("");
  const [quantityMade, setQuantityMade] = useState("1");
  const [preview, setPreview] = useState<Preview>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      const quantity = Number(quantityMade);
      if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
        if (!cancelled) setPreview(null);
        return;
      }
      startTransition(async () => {
        const result = await previewBatchAction(productId, quantity);
        if (!cancelled) setPreview(result);
      });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [productId, quantityMade]);

  const shortCount = preview?.ingredients.filter((i) => i.short).length ?? 0;

  return (
    <form action={formAction} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <input type="hidden" name="productId" value={productId} />

      {/* Left Column: Form Inputs (lg: 7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        <Field label="Target Product" htmlFor="product" errors={state.errors?.productId}>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger id="product" className="w-full text-base">
              <SelectValue placeholder="Pick a product with a recipe formula" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                  {p.packageSize ? ` · ${p.packageSize}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="space-y-1.5">
          <Label htmlFor="quantityMade" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quantity Made (Units)
          </Label>
          <QuantityInput name="quantityMade" value={quantityMade} onChange={setQuantityMade} />
          {state.errors?.quantityMade ? (
            <p role="alert" className="text-destructive text-xs">
              {state.errors.quantityMade[0]}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField name="producedAt" label="Production Date" errors={state.errors?.producedAt} />

          <div>
            <DateField
              name="expiryDate"
              label="Expiry Date"
              defaultValue=""
              allowFuture
              errors={state.errors?.expiryDate}
            />
            <p className="text-muted-foreground text-[11px] mt-1">
              Leave blank to use default product shelf life.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Live Ingredient Deduction Preview (lg: 5 cols) */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
        <Card className={`shadow-xs border ${shortCount > 0 ? "border-warning/40" : "border-border/80"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span>Ingredient Stock Check</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Live consumption preview based on current raw stock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!productId ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Select a product to view required raw materials.
              </p>
            ) : preview ? (
              <div className="space-y-3">
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium ${
                    shortCount === 0
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-warning/10 text-warning border-warning/20"
                  }`}
                >
                  {shortCount === 0 ? (
                    <>
                      <Check className="size-4 shrink-0" />
                      <span>Sufficient materials available in stock</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>Short on {shortCount} ingredient{shortCount > 1 ? "s" : ""}</span>
                    </>
                  )}
                </div>

                <ul className="divide-y divide-border/60 text-xs">
                  {preview.ingredients.map((ing) => (
                    <li key={ing.id} className="flex justify-between items-center py-2">
                      <span className="text-foreground truncate font-medium">{ing.name}</span>
                      <span className={ing.short ? "text-warning font-bold" : "text-muted-foreground"}>
                        {formatQty(ing.needed, unitLabel(ing.unit))}
                        {ing.short ? ` (avail: ${formatQty(ing.available)})` : ""}
                      </span>
                    </li>
                  ))}
                </ul>

                {shortCount > 0 && (
                  <p className="text-muted-foreground text-[11px] leading-tight bg-muted/40 p-2 rounded">
                    You can still log this batch. Stock will show negative until you enter your raw purchase.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">Calculating deductions…</p>
            )}

            <FormMessage message={state.message} tone={state.ok ? "success" : "error"} />

            <div className="space-y-2 pt-2 border-t">
              <SubmitButton className="w-full h-11 text-sm font-semibold">
                Complete Batch Run
              </SubmitButton>
              <SubmitButton intent="save-and-add-another" variant="outline" className="w-full text-xs">
                Log &amp; produce another
              </SubmitButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
