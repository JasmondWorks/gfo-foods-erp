import { Prisma } from "@prisma/client";

export type Decimal = Prisma.Decimal;
export const D = Prisma.Decimal;

/** Coerce anything user- or db-shaped into a Decimal. Never use floats for money or quantity. */
export function toDecimal(value: Prisma.Decimal | number | string | null | undefined): Decimal {
  if (value === null || value === undefined || value === "") return new D(0);
  return new D(value);
}

/** Money rounds to 2dp, quantities to 3dp — matching the column scales in schema.prisma. */
export const MONEY_DP = 2;
export const QTY_DP = 3;

export const money = (value: Prisma.Decimal | number | string): Decimal =>
  toDecimal(value).toDecimalPlaces(MONEY_DP, D.ROUND_HALF_UP);

export const qty = (value: Prisma.Decimal | number | string): Decimal =>
  toDecimal(value).toDecimalPlaces(QTY_DP, D.ROUND_HALF_UP);

/** Decimals cannot cross the server/client boundary — serialise at the edge. */
export const toNumber = (value: Prisma.Decimal | number | string | null | undefined): number =>
  toDecimal(value).toNumber();
