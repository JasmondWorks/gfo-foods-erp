import { z } from "zod";

/** Field-level errors keyed by input name, plus an optional form-level message. */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export const EMPTY_FORM_STATE: FormState = {};

export function fieldErrors(error: z.ZodError): FormState {
  const flat = z.flattenError(error);
  return { ok: false, errors: flat.fieldErrors as Record<string, string[]> };
}

/**
 * Money and quantities arrive from HTML inputs as strings. Keep them as strings
 * all the way to Prisma, which parses them into Decimal — going via Number here
 * would reintroduce the float rounding the schema exists to avoid.
 */
const decimalString = (label: string, { min = 0 }: { min?: number } = {}) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => /^\d+(\.\d+)?$/.test(v), `${label} must be a number`)
    .refine((v) => Number(v) >= min, `${label} cannot be negative`);

export const moneyField = (label: string) => decimalString(label);
export const qtyField = (label: string) => decimalString(label);

/** Optional numeric field: blank means "not set", not zero. */
export const optionalQtyField = (label: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? "0" : v))
    .pipe(decimalString(label));

export const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

/** Every create form accepts a user-set date, past or present (FR-8). */
export const dateField = z
  .string()
  .trim()
  .min(1, "Date is required")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Date is not valid")
  .transform((v) => new Date(`${v}T12:00:00`)); // midday avoids UTC/Lagos day-shift
