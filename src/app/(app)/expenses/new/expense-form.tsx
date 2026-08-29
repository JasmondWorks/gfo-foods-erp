"use client";

import { useActionState, useState } from "react";
import { DateField } from "@/components/common/entry-fields";
import { Field, FormMessage, SubmitButton } from "@/components/common/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createExpenseAction } from "@/server/actions/entries";
import { EMPTY_FORM_STATE } from "@/server/validation/shared";

export function ExpenseForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState(createExpenseAction, EMPTY_FORM_STATE);
  const [category, setCategory] = useState("");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="category" value={category} />

      <Field label="Category" htmlFor="category" errors={state.errors?.category}>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Pick a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Amount (₦)" htmlFor="amount" errors={state.errors?.amount}>
        <Input id="amount" name="amount" inputMode="decimal" autoFocus required />
      </Field>

      <DateField name="date" label="Date" errors={state.errors?.date} />

      <Field label="Note" htmlFor="notes" hint="Optional." errors={state.errors?.notes}>
        <Textarea id="notes" name="notes" rows={2} />
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
