import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EXPENSE_CATEGORIES = [
  "Transport",
  "Packaging",
  "Rent",
  "Utilities",
  "Marketing",
  "Equipment",
  "Other",
];

async function main() {
  const email = (process.env.SEED_USER_EMAIL ?? "owner@gfofoods.ng").toLowerCase();
  const password = process.env.SEED_USER_PASSWORD;

  if (!password) {
    throw new Error("SEED_USER_PASSWORD is not set — refusing to seed a default password.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: process.env.SEED_USER_NAME ?? "Owner" },
  });
  console.log(`✓ owner account: ${user.email}`);

  for (const [i, name] of EXPENSE_CATEGORIES.entries()) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: { sortOrder: i },
      create: { name, sortOrder: i },
    });
  }
  console.log(`✓ ${EXPENSE_CATEGORIES.length} expense categories`);

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  console.log("✓ settings row");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
