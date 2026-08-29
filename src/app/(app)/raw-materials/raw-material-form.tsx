"use client";

import { useActionState } from "react";
import { Unit } from "@prisma/client";
import { Field, FormMessage, SubmitButton } from "@/components/common/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNITS, unitLabel } from "@/lib/units";
import { EMPTY_FORM_STATE, type FormState } from "@/server/validation/shared";

type Values = { name: string; unit: Unit | ""; reorderThreshold: string };

export function RawMaterialForm({
  action,
  values,
  submitLabel,
  allowAddAnother = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  values?: Values;
  submitLabel: string;
  allowAddAnother?: boolean;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Name" htmlFor="name" errors={state.errors?.name}>
        <Input
          id="name"
          name="name"
          defaultValue={values?.name}
          placeholder="Ground pepper"
          autoFocus={!values}
          required
        />
      </Field>

      <Field label="Unit" htmlFor="unit" errors={state.errors?.unit}>
        <Select name="unit" defaultValue={values?.unit || undefined}>
          <SelectTrigger id="unit" className="w-full">
            <SelectValue placeholder="Pick a unit" />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map((unit) => (
              <SelectItem key={unit} value={unit}>
                {unitLabel(unit)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label="Alert me below"
        htmlFor="reorderThreshold"
        hint="Leave at 0 to skip low-stock alerts for this material."
        errors={state.errors?.reorderThreshold}
      >
        <Input
          id="reorderThreshold"
          name="reorderThreshold"
          inputMode="decimal"
          defaultValue={values?.reorderThreshold ?? "0"}
        />
      </Field>

      <FormMessage message={state.errors ? undefined : state.message} tone="success" />

      <div className="space-y-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        {allowAddAnother ? (
          <SubmitButton intent="save-and-add-another" variant="outline">
            Save &amp; add another
          </SubmitButton>
        ) : null}
      </div>
    </form>
  );
}
