"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  batchSchema,
  expenseSchema,
  purchaseSchema,
  saleSchema,
} from "@/server/validation/entries";
import { fieldErrors, type FormState } from "@/server/validation/shared";
import { requireUser } from "@/server/services/auth-guard";
import { recordBatch, previewBatch } from "@/server/services/batches";
import { recordExpense } from "@/server/services/expenses";
import { recordPurchase } from "@/server/services/purchases";
import { recordPayment, recordSale } from "@/server/services/sales";

const isAddAnother = (formData: FormData) => formData.get("intent") === "save-and-add-another";

/** Shortages are reported, never blocking — see FR-4. */
function warning(shortages: { name: string }[]): string | undefined {
  if (shortages.length === 0) return undefined;
  const names = shortages.map((s) => s.name).join(", ");
  return `Saved. Stock went negative on ${names} — log the purchase you missed, or run a stock count.`;
}

export async function createPurchaseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = purchaseSchema.safeParse({
    rawMaterialId: formData.get("rawMaterialId") ?? "",
    quantity: formData.get("quantity") ?? "",
    totalCost: formData.get("totalCost") ?? "",
    supplier: formData.get("supplier") ?? "",
    purchasedAt: formData.get("purchasedAt") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const { materialName } = await recordPurchase(parsed.data);
  revalidatePath("/");
  revalidatePath("/purchases");
  revalidatePath("/raw-materials");

  if (isAddAnother(formData)) return { ok: true, message: `${materialName} purchase saved.` };
  redirect("/purchases");
}

export async function createBatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = batchSchema.safeParse({
    productId: formData.get("productId") ?? "",
    quantityMade: formData.get("quantityMade") ?? "",
    producedAt: formData.get("producedAt") ?? "",
    expiryDate: formData.get("expiryDate") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  let result;
  try {
    result = await recordBatch(parsed.data);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save the batch." };
  }

  revalidatePath("/");
  revalidatePath("/batches");
  revalidatePath("/raw-materials");
  revalidatePath("/products");

  const shortageWarning = warning(result.shortages);
  if (isAddAnother(formData) || shortageWarning) {
    return {
      ok: true,
      message: shortageWarning ?? `Batch ${result.batchNumber} saved.`,
    };
  }
  redirect(`/batches/${result.batchId}`);
}

export async function createSaleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();

  // Repeatable line rows arrive as parallel arrays.
  const productIds = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const unitPrices = formData.getAll("unitPrice").map(String);
  const items = productIds
    .map((productId, i) => ({
      productId,
      quantity: quantities[i] ?? "",
      unitPrice: unitPrices[i] ?? "",
    }))
    .filter((row) => row.productId !== "");

  const parsed = saleSchema.safeParse({
    customerName: formData.get("customerName") ?? "",
    saleDate: formData.get("saleDate") ?? "",
    amountPaid: formData.get("amountPaid") ?? "",
    notes: formData.get("notes") ?? "",
    items,
  });
  if (!parsed.success) {
    const state = fieldErrors(parsed.error);
    const nested = parsed.error.issues.find((i) => i.path[0] === "items");
    return nested ? { ...state, message: nested.message } : state;
  }

  let result;
  try {
    result = await recordSale(parsed.data);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save the sale." };
  }

  revalidatePath("/");
  revalidatePath("/sales");
  revalidatePath("/products");

  const shortageWarning = warning(result.shortages);
  if (isAddAnother(formData) || shortageWarning) {
    return { ok: true, message: shortageWarning ?? "Sale saved." };
  }
  redirect(`/sales/${result.saleId}`);
}

export async function createExpenseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = expenseSchema.safeParse({
    category: formData.get("category") ?? "",
    amount: formData.get("amount") ?? "",
    date: formData.get("date") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  await recordExpense(parsed.data);
  revalidatePath("/");
  revalidatePath("/expenses");

  if (isAddAnother(formData)) return { ok: true, message: "Expense saved." };
  redirect("/expenses");
}

export async function recordPaymentAction(
  saleId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const amount = String(formData.get("amount") ?? "").trim();
  if (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0) {
    return { ok: false, message: "Enter an amount greater than zero." };
  }

  await recordPayment(saleId, amount);
  revalidatePath("/");
  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  return { ok: true, message: "Payment recorded." };
}

/** Called from the batch form as she types, for the live availability check. */
export async function previewBatchAction(productId: string, quantityMade: number) {
  await requireUser();
  return previewBatch(productId, quantityMade);
}
