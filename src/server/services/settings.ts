import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  id: "singleton",
  businessName: "GFO Foods",
  currency: "NGN",
  reminderOn: false,
  reminderHour: 20,
};

/** Reads the single settings row, falling back to defaults before the seed runs. */
export async function getSettings() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  return settings ?? { ...DEFAULTS, updatedAt: new Date() };
}
