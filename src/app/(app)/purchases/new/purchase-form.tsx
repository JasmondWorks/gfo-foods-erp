"use client";

import { useActionState, useMemo, useState } from "react";
import type { Unit } from "@prisma/client";
import { ShoppingCart } from "lucide-react";
import { DateField, QuantityInput } from "@/components/common/entry-fields";
import { Field, FormMessage, SubmitButton } from "@/components/common/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNaira, formatQty } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { createPurchaseAction } from "@/server/actions/entries";
import { EMPTY_FORM_STATE } from "@/server/validation/shared";

type Material = { id: string; name: string; unit: Unit; quantityOnHand: number };

export function PurchaseForm({ materials }: { materials: Material[] }) {
  const [state, formAction] = useActionState(createPurchaseAction, EMPTY_FORM_STATE);
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [totalCost, setTotalCost] = useState("");

  const material = useMemo(
    () => materials.find((m) => m.id === materialId),
    [materials, materialId],
  );

  const unitCost = useMemo(() => {
    const q = Number(quantity);
    const t = Number(totalCost);
    return q > 0 && Number.isFinite(t) ? t / q : null;
  }, [quantity, totalCost]);

  return (
    <form action={formAction} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <input type="hidden" name="rawMaterialId" value={materialId} />

      {/* Left: Input Fields (lg: 7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        <Field label="Raw Material" htmlFor="material" errors={state.errors?.rawMaterialId}>
          <Select value={materialId} onValueChange={setMaterialId}>
            <SelectTrigger id="material" className="w-full text-base">
              <SelectValue placeholder="Select raw ingredient or packaging" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({unitLabel(m.unit)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="space-y-1.5">
          <Label htmlFor="quantity" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quantity Purchased {material ? `(${unitLabel(material.unit)})` : ""}
          </Label>
          <QuantityInput name="quantity" value={quantity} onChange={setQuantity} />
          {state.errors?.quantity ? (
            <p role="alert" className="text-destructive text-xs">
              {state.errors.quantity[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="totalCost" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Purchase Cost (₦)
          </Label>
          <Input
            id="totalCost"
            name="totalCost"
            inputMode="decimal"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            placeholder="e.g. 45000"
            className="tabular-nums text-base"
            required
          />
          {state.errors?.totalCost ? (
            <p role="alert" className="text-destructive text-xs">
              {state.errors.totalCost[0]}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField name="purchasedAt" label="Receipt Date" errors={state.errors?.purchasedAt} />

          <Field label="Supplier / Vendor" htmlFor="supplier" hint="Optional" errors={state.errors?.supplier}>
            <Input id="supplier" name="supplier" placeholder="e.g. Mile 12 / Alaba Market" />
          </Field>
        </div>
      </div>

      {/* Right: Procurement Calculation Card (lg: 5 cols) */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShoppingCart className="size-4 text-chart-3" />
              <span>Procurement Ledger Impact</span>
            </CardTitle>
            <CardDescription className="text-xs">
              New stock and weighted cost automatically calculated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Material</span>
              <span className="font-semibold text-foreground">{material?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Quantity to Add</span>
              <span className="font-semibold text-foreground">
                {material ? `+${formatQty(Number(quantity) || 0, unitLabel(material.unit))}` : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Calculated Unit Cost</span>
              <span className="font-bold text-foreground tabular-nums">
                {unitCost !== null && material
                  ? `${formatNaira(unitCost)} / ${unitLabel(material.unit)}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t text-sm font-bold">
              <span>Total Invoice</span>
              <span className="text-primary tabular-nums">
                {totalCost ? formatNaira(Number(totalCost)) : "₦0"}
              </span>
            </div>

            <FormMessage message={state.message} tone={state.ok ? "success" : "error"} />

            <div className="space-y-2 pt-2 border-t">
              <SubmitButton className="w-full h-11 text-sm font-semibold">
                Save Purchase &amp; Update Stock
              </SubmitButton>
              <SubmitButton intent="save-and-add-another" variant="outline" className="w-full text-xs">
                Save &amp; add another
              </SubmitButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
