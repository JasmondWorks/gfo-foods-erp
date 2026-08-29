"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/common/form";
import { deleteProductAction } from "@/server/actions/products";
import { EMPTY_FORM_STATE } from "@/server/validation/shared";

export function DeleteProduct({ id }: { id: string }) {
  const [state, formAction] = useActionState(deleteProductAction.bind(null, id), EMPTY_FORM_STATE);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm("Delete this product?")) event.preventDefault();
      }}
      className="space-y-2 pt-2"
    >
      <SubmitButton variant="ghost" className="text-destructive">
        Delete product
      </SubmitButton>
      <FormMessage message={state.message} />
    </form>
  );
}
