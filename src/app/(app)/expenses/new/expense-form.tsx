"use client";

import { useActionState, useState } from "react";
import { Receipt } from "lucide-react";
import { DateField } from "@/components/common/entry-fields";
import { Field, FormMessage, SubmitButton } from "@/components/common/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <form action={formAction} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <input type="hidden" name="category" value={category} />

      {/* Left: Input Fields (lg: 7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        <Field label="Expense Category" htmlFor="category" errors={state.errors?.category}>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="w-full text-base">
              <SelectValue placeholder="Pick an operating expense category" />
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

        <Field label="Amount Spent (₦)" htmlFor="amount" errors={state.errors?.amount}>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="e.g. 12000"
            className="tabular-nums text-base"
            autoFocus
            required
          />
        </Field>

        <DateField name="date" label="Expense Date" errors={state.errors?.date} />

        <Field label="Notes / Description" htmlFor="notes" hint="Optional details for audit" errors={state.errors?.notes}>
          <Textarea id="notes" name="notes" placeholder="e.g. Fuel for generator, dispatch rider delivery fee" rows={3} />
        </Field>
      </div>

      {/* Right: Confirmation & Action (lg: 5 cols) */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="size-4 text-warning" />
              <span>Overhead Ledger Entry</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Operating costs will be accounted for in monthly net profit reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormMessage message={state.message} tone={state.ok ? "success" : "error"} />

            <div className="space-y-2 pt-2">
              <SubmitButton className="w-full h-11 text-sm font-semibold">
                Record Expense
              </SubmitButton>
              <SubmitButton intent="save-and-add-another" variant="outline" className="w-full text-xs">
                Record &amp; add another
              </SubmitButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
