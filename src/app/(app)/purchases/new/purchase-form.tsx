"use client";

import { useActionState, useMemo, useState } from "react";
import type { Unit } from "@prisma/client";
import { DateField, QuantityInput } from "@/components/common/entry-fields";
import { Field, FormMessage, SubmitButton } from "@/components/common/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNaira } from "@/lib/format";
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

  // Unit cost is shown, never typed — one less field, and it confirms the
  // total she entered is the number she meant.
  const unitCost = useMemo(() => {
    const q = Number(quantity);
    const t = Number(totalCost);
    return q > 0 && Number.isFinite(t) ? t / q : null;
  }, [quantity, totalCost]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="rawMaterialId" value={materialId} />

      <Field label="Material" htmlFor="material" errors={state.errors?.rawMaterialId}>
        <Select value={materialId} onValueChange={setMaterialId}>
          <SelectTrigger id="material" className="w-full">
            <SelectValue placeholder="Pick a material" />
          </SelectTrigger>
          <SelectContent>
            {materials.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="space-y-1.5">
        <Label htmlFor="quantity">
          Quantity {material ? `(${unitLabel(material.unit)})` : ""}
        </Label>
        <QuantityInput name="quantity" value={quantity} onChange={setQuantity} />
        {state.errors?.quantity ? (
          <p role="alert" className="text-destructive text-xs">
            {state.errors.quantity[0]}
          </p>
        ) : null}
      </div>

      <Field
        label="Total cost (₦)"
        htmlFor="totalCost"
        hint={
          unitCost !== null && material
            ? `${formatNaira(unitCost)} per ${unitLabel(material.unit)}`
            : "What you paid altogether."
        }
        errors={state.errors?.totalCost}
      >
        <Input
          id="totalCost"
          name="totalCost"
          inputMode="decimal"
          value={totalCost}
          onChange={(e) => setTotalCost(e.target.value)}
          required
        />
      </Field>

      <DateField name="purchasedAt" label="Date bought" errors={state.errors?.purchasedAt} />

      <Field label="Supplier" htmlFor="supplier" hint="Optional." errors={state.errors?.supplier}>
        <Input id="supplier" name="supplier" />
      </Field>

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
