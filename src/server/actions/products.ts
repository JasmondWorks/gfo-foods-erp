"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { productSchema, recipeSchema } from "@/server/validation/products";
import { fieldErrors, type FormState } from "@/server/validation/shared";
import { requireUser } from "@/server/services/auth-guard";
import { createProduct, deleteProduct, updateProduct } from "@/server/services/products";
import { saveRecipe } from "@/server/services/recipes";

function parseProduct(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name") ?? "",
    packageSize: formData.get("packageSize") ?? "",
    sellingPrice: formData.get("sellingPrice") ?? "",
    reorderThreshold: formData.get("reorderThreshold") ?? "",
    trackExpiry: formData.get("trackExpiry") === "on",
    shelfLifeDays: formData.get("shelfLifeDays") ?? "",
  });
}

export async function createProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = parseProduct(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const product = await createProduct(parsed.data);
  revalidatePath("/products");
  // Straight into the recipe editor — a product without a recipe can't be produced.
  redirect(`/products/${product.id}/recipe`);
}

export async function updateProductAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = parseProduct(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  await updateProduct(id, parsed.data);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function deleteProductAction(id: string, _prev: FormState): Promise<FormState> {
  await requireUser();
  const result = await deleteProduct(id);
  if (!result.ok) return { ok: false, message: result.reason };

  revalidatePath("/products");
  redirect("/products");
}

export async function saveRecipeAction(
  productId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  // Ingredient rows arrive as parallel arrays from the repeatable form fields.
  const rawMaterialIds = formData.getAll("rawMaterialId").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const ingredients = rawMaterialIds
    .map((rawMaterialId, i) => ({ rawMaterialId, quantity: quantities[i] ?? "" }))
    .filter((row) => row.rawMaterialId !== "");

  const parsed = recipeSchema.safeParse({
    yieldQty: formData.get("yieldQty") ?? "",
    yieldUnit: formData.get("yieldUnit") ?? "",
    notes: formData.get("notes") ?? "",
    ingredients,
  });
  if (!parsed.success) {
    const state = fieldErrors(parsed.error);
    // Nested ingredient errors don't survive flattening — surface them as one message.
    const nested = parsed.error.issues.find((i) => i.path[0] === "ingredients");
    return nested ? { ...state, message: nested.message } : state;
  }

  await saveRecipe(productId, parsed.data);
  revalidatePath(`/products/${productId}`);
  revalidatePath(`/products/${productId}/recipe`);
  redirect(`/products/${productId}`);
}
