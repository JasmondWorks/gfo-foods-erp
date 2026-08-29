"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/common/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EMPTY_FORM_STATE, type FormState } from "@/server/validation/shared";

type Values = {
  name: string;
  packageSize: string;
  sellingPrice: string;
  reorderThreshold: string;
  trackExpiry: boolean;
  shelfLifeDays: string;
};

export function ProductForm({
  action,
  values,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  values?: Values;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const [trackExpiry, setTrackExpiry] = useState(values?.trackExpiry ?? true);

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Name" htmlFor="name" errors={state.errors?.name}>
        <Input
          id="name"
          name="name"
          defaultValue={values?.name}
          placeholder="Suya spice mix"
          autoFocus={!values}
          required
        />
      </Field>

      <Field
        label="Package size"
        htmlFor="packageSize"
        hint="Optional — e.g. 50g, 200g."
        errors={state.errors?.packageSize}
      >
        <Input id="packageSize" name="packageSize" defaultValue={values?.packageSize} placeholder="50g" />
      </Field>

      <Field label="Selling price (₦)" htmlFor="sellingPrice" errors={state.errors?.sellingPrice}>
        <Input
          id="sellingPrice"
          name="sellingPrice"
          inputMode="decimal"
          defaultValue={values?.sellingPrice}
          required
        />
      </Field>

      <Field
        label="Alert me below"
        htmlFor="reorderThreshold"
        hint="Leave at 0 to skip low-stock alerts for this product."
        errors={state.errors?.reorderThreshold}
      >
        <Input
          id="reorderThreshold"
          name="reorderThreshold"
          inputMode="decimal"
          defaultValue={values?.reorderThreshold ?? "0"}
        />
      </Field>

      <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
        <Label htmlFor="trackExpiry" className="font-normal">
          Track expiry dates
        </Label>
        <Switch
          id="trackExpiry"
          name="trackExpiry"
          checked={trackExpiry}
          onCheckedChange={setTrackExpiry}
        />
      </div>

      {trackExpiry ? (
        <Field
          label="Shelf life (days)"
          htmlFor="shelfLifeDays"
          hint="Used to suggest an expiry date when you log a batch."
          errors={state.errors?.shelfLifeDays}
        >
          <Input
            id="shelfLifeDays"
            name="shelfLifeDays"
            inputMode="numeric"
            defaultValue={values?.shelfLifeDays}
            placeholder="180"
          />
        </Field>
      ) : null}

      <FormMessage message={state.message} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
