import { z } from "zod";
import { dateField, moneyField, optionalText, qtyField } from "./shared";

export const purchaseSchema = z.object({
  rawMaterialId: z.string().min(1, "Pick a material"),
  quantity: qtyField("Quantity").refine((v) => Number(v) > 0, "Quantity must be more than zero"),
  totalCost: moneyField("Total cost"),
  supplier: optionalText,
  purchasedAt: dateField,
  notes: optionalText,
});

export const batchSchema = z.object({
  productId: z.string().min(1, "Pick a product"),
  quantityMade: qtyField("Quantity").refine((v) => Number(v) > 0, "Quantity must be more than zero"),
  producedAt: dateField,
  expiryDate: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Expiry date is not valid")
    .transform((v) => (v === null ? null : new Date(`${v}T12:00:00`))),
  notes: optionalText,
});

export const saleSchema = z.object({
  // A walk-in sale needs no customer at all — this stays optional on purpose.
  customerName: optionalText,
  saleDate: dateField,
  amountPaid: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || /^\d+(\.\d+)?$/.test(v), "Amount paid must be a number"),
  notes: optionalText,
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Pick a product"),
        quantity: qtyField("Quantity").refine((v) => Number(v) > 0, "Quantity must be more than zero"),
        unitPrice: moneyField("Price"),
      }),
    )
    .min(1, "Add at least one product")
    .refine(
      (rows) => new Set(rows.map((r) => r.productId)).size === rows.length,
      "Each product can only appear once on a sale",
    ),
});

export const expenseSchema = z.object({
  category: z.string().trim().min(1, "Pick a category"),
  amount: moneyField("Amount").refine((v) => Number(v) > 0, "Amount must be more than zero"),
  date: dateField,
  notes: optionalText,
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type BatchInput = z.infer<typeof batchSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
