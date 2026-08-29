import { z } from "zod";
import { Unit } from "@prisma/client";
import { optionalQtyField } from "./shared";

export const rawMaterialSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  unit: z.enum(Unit, { message: "Pick a unit" }),
  // Stock is never entered on a form — see FR-2. Only the threshold is editable.
  reorderThreshold: optionalQtyField("Reorder threshold"),
});

export type RawMaterialInput = z.infer<typeof rawMaterialSchema>;
