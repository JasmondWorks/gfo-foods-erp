import { toNumber } from "@/lib/decimal";
import { prisma } from "@/lib/prisma";
import type { ExpenseInput } from "@/server/validation/entries";

export async function listExpenseCategories() {
  const categories = await prisma.expenseCategory.findMany({
    where: { archived: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return categories;
}

export async function recordExpense(input: ExpenseInput) {
  return prisma.expense.create({
    data: {
      category: input.category,
      amount: input.amount,
      date: input.date,
      notes: input.notes,
    },
  });
}

export async function listExpenses({ take = 50 }: { take?: number } = {}) {
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" }, take });
  return expenses.map((e) => ({
    id: e.id,
    category: e.category,
    amount: toNumber(e.amount),
    date: e.date,
    notes: e.notes,
  }));
}
