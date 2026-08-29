import { z } from "zod";
import { Unit } from "@prisma/client";
import { moneyField, optionalQtyField, optionalText } from "./shared";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  packageSize: optionalText,
  sellingPrice: moneyField("Selling price"),
  reorderThreshold: optionalQtyField("Low stock alert"),
  trackExpiry: z.coerce.boolean(),
  shelfLifeDays: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v > 0), "Shelf life must be a whole number of days")
    .nullable(),
});

export const recipeSchema = z.object({
  yieldQty: z
    .string()
    .trim()
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, "Yield must be greater than zero"),
  yieldUnit: z.enum(Unit, { message: "Pick a unit" }),
  notes: optionalText,
  ingredients: z
    .array(
      z.object({
        rawMaterialId: z.string().min(1, "Pick a material"),
        quantity: z
          .string()
          .trim()
          .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, "Quantity must be greater than zero"),
      }),
    )
    .min(1, "A recipe needs at least one ingredient")
    .refine(
      (rows) => new Set(rows.map((r) => r.rawMaterialId)).size === rows.length,
      "Each material can only appear once",
    ),
});

export type ProductInput = z.infer<typeof productSchema>;
export type RecipeInput = z.infer<typeof recipeSchema>;
