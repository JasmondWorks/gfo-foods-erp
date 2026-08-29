import { Unit } from "@prisma/client";

export const UNITS = [Unit.G, Unit.KG, Unit.ML, Unit.L, Unit.PIECE, Unit.PACK] as const;

export const UNIT_LABELS: Record<Unit, string> = {
  G: "g",
  KG: "kg",
  ML: "ml",
  L: "L",
  PIECE: "piece",
  PACK: "pack",
};

export const unitLabel = (unit: Unit) => UNIT_LABELS[unit];
