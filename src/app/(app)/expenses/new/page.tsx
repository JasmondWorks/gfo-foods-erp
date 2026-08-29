import { PageHeader } from "@/components/common/page-header";
import { listExpenseCategories } from "@/server/services/expenses";
import { ExpenseForm } from "./expense-form";

export default async function NewExpensePage() {
  const categories = await listExpenseCategories();

  return (
    <div>
      <PageHeader title="Add expense" backHref="/" />
      <ExpenseForm categories={categories} />
    </div>
  );
}
