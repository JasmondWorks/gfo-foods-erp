"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { DateField, QuantityInput } from "@/components/common/entry-fields";
import { Field, FormMessage, SubmitButton } from "@/components/common/form";
import { Card, CardContent } from "@/components/ui/card";
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

  /**
   * Live ingredient availability check (BUILD_SPEC §3.3): green when there is
   * enough stock, a warning when short — but never a block, because she may
   * have bought materials without logging them yet.
   */
  useEffect(() => {
    let cancelled = false;

    // Debounced so typing a quantity doesn't fire a request per keystroke. Every
    // state update happens in this callback rather than the effect body, which
    // would cascade renders.
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
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="productId" value={productId} />

      <Field label="Product" htmlFor="product" errors={state.errors?.productId}>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger id="product" className="w-full">
            <SelectValue placeholder="Pick a product" />
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
        <Label htmlFor="quantityMade">Quantity made</Label>
        <QuantityInput name="quantityMade" value={quantityMade} onChange={setQuantityMade} />
        {state.errors?.quantityMade ? (
          <p role="alert" className="text-destructive text-xs">
            {state.errors.quantityMade[0]}
          </p>
        ) : null}
      </div>

      {preview ? (
        <Card>
          <CardContent className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              {shortCount === 0 ? (
                <>
                  <Check className="text-success size-4" />
                  You have enough for this
                </>
              ) : (
                <>
                  <AlertTriangle className="text-warning size-4" />
                  Short on {shortCount} ingredient{shortCount > 1 ? "s" : ""}
                </>
              )}
            </p>
            <ul className="space-y-1 text-sm">
              {preview.ingredients.map((ing) => (
                <li key={ing.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate">{ing.name}</span>
                  <span className={ing.short ? "text-warning font-medium" : ""}>
                    {formatQty(ing.needed, unitLabel(ing.unit))}
                    {ing.short ? ` of ${formatQty(ing.available)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            {shortCount > 0 ? (
              <p className="text-muted-foreground text-xs">
                You can still save this — stock will go negative until you log the purchase.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <DateField name="producedAt" label="Date made" errors={state.errors?.producedAt} />

      <DateField
        name="expiryDate"
        label="Expires"
        defaultValue=""
        allowFuture
        errors={state.errors?.expiryDate}
      />
      <p className="text-muted-foreground -mt-4 text-xs">
        Leave blank to use the product&apos;s shelf life.
      </p>

      <FormMessage message={state.message} tone={state.ok ? "success" : "error"} />

      <div className="space-y-2">
        <SubmitButton>Save</SubmitButton>
        <SubmitButton intent="save-and-add-another" variant="outline">
          Save &amp; add another
        </SubmitButton>
      </div>
    </form>
  );
}
