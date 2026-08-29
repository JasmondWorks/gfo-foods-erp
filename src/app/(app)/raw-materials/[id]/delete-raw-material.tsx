"use client";

import { useActionState } from "react";
import { deleteRawMaterialAction } from "@/server/actions/raw-materials";
import { FormMessage, SubmitButton } from "@/components/common/form";
import { EMPTY_FORM_STATE } from "@/server/validation/shared";

export function DeleteRawMaterial({ id }: { id: string }) {
  const [state, formAction] = useActionState(
    deleteRawMaterialAction.bind(null, id),
    EMPTY_FORM_STATE,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm("Delete this material?")) event.preventDefault();
      }}
      className="space-y-2 pt-2"
    >
      <SubmitButton variant="ghost" className="text-destructive">
        Delete material
      </SubmitButton>
      <FormMessage message={state.message} />
    </form>
  );
}
