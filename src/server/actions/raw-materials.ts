"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { rawMaterialSchema } from "@/server/validation/raw-materials";
import { fieldErrors, type FormState } from "@/server/validation/shared";
import { requireUser } from "@/server/services/auth-guard";
import {
  createRawMaterial,
  deleteRawMaterial,
  updateRawMaterial,
} from "@/server/services/raw-materials";

function parse(formData: FormData) {
  return rawMaterialSchema.safeParse({
    name: formData.get("name") ?? "",
    unit: formData.get("unit") ?? "",
    reorderThreshold: formData.get("reorderThreshold") ?? "",
  });
}

export async function createRawMaterialAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  await createRawMaterial(parsed.data);
  revalidatePath("/raw-materials");

  // "Save & add another" keeps her on the form — the whole point is not
  // making her navigate back for the next one.
  if (formData.get("intent") === "save-and-add-another") {
    return { ok: true, message: `${parsed.data.name} saved.` };
  }
  redirect("/raw-materials");
}

export async function updateRawMaterialAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  await updateRawMaterial(id, parsed.data);
  revalidatePath("/raw-materials");
  revalidatePath(`/raw-materials/${id}`);
  redirect(`/raw-materials/${id}`);
}

export async function deleteRawMaterialAction(
  id: string,
  _prev: FormState,
): Promise<FormState> {
  await requireUser();
  try {
    const result = await deleteRawMaterial(id);
    if (!result.ok) return { ok: false, message: result.reason };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, message: "This material is still referenced elsewhere." };
    }
    throw error;
  }
  revalidatePath("/raw-materials");
  redirect("/raw-materials");
}
