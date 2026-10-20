"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/services/auth-guard";

export async function updateSettingsAction(formData: FormData) {
  await requireUser();
  const businessName = String(formData.get("businessName") || "GFO Foods").trim();
  const reminderOn = formData.get("reminderOn") === "on";
  const reminderHour = Math.min(23, Math.max(0, Number(formData.get("reminderHour") || 20)));

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { businessName, reminderOn, reminderHour },
    create: { id: "singleton", businessName, reminderOn, reminderHour },
  });

  revalidatePath("/", "layout");
}
