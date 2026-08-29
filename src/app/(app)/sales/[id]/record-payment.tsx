"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/common/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordPaymentAction } from "@/server/actions/entries";
import { EMPTY_FORM_STATE } from "@/server/validation/shared";

export function RecordPayment({ saleId, outstanding }: { saleId: string; outstanding: number }) {
  const [state, formAction] = useActionState(
    recordPaymentAction.bind(null, saleId),
    EMPTY_FORM_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="amount">Record a payment (₦)</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          defaultValue={String(outstanding)}
          required
        />
      </div>
      <SubmitButton variant="outline">Record payment</SubmitButton>
      <FormMessage message={state.message} tone={state.ok ? "success" : "error"} />
    </form>
  );
}
