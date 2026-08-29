import { D, money, toNumber } from "@/lib/decimal";
import { prisma } from "@/lib/prisma";
import { TIME_ZONE } from "@/lib/format";

const DAY = 86_400_000;

/** Start of the current month in Africa/Lagos, not in the server's timezone. */
function startOfMonthLagos(now = new Date()): Date {
  const [year, month] = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
}

export type Alert = {
  kind: "low-material" | "low-product" | "expiring" | "unpaid" | "stale";
  message: string;
  href: string;
};

/** FR-7, computed on dashboard load — never stored, never stale. */
export async function getAlerts(): Promise<Alert[]> {
  const now = new Date();
  const alerts: Alert[] = [];

  const [materials, products, expiring, unpaid] = await Promise.all([
    prisma.rawMaterial.findMany({
      where: { reorderThreshold: { gt: 0 } },
      select: { id: true, name: true, quantityOnHand: true, reorderThreshold: true },
    }),
    prisma.product.findMany({
      where: { reorderThreshold: { gt: 0 } },
      select: { id: true, name: true, quantityOnHand: true, reorderThreshold: true },
    }),
    prisma.batch.findMany({
      where: { expiryDate: { not: null, lte: new Date(now.getTime() + 30 * DAY) } },
      orderBy: { expiryDate: "asc" },
      select: { id: true, batchNumber: true, expiryDate: true },
    }),
    prisma.sale.findMany({
      where: {
        paymentStatus: { in: ["UNPAID", "PARTIAL"] },
        saleDate: { lte: new Date(now.getTime() - 14 * DAY) },
      },
      select: { id: true, customer: { select: { name: true } } },
    }),
  ]);

  for (const m of materials) {
    if (new D(m.quantityOnHand).lessThanOrEqualTo(new D(m.reorderThreshold))) {
      alerts.push({
        kind: "low-material",
        message: `${m.name} is running low`,
        href: `/raw-materials/${m.id}`,
      });
    }
  }

  for (const p of products) {
    if (new D(p.quantityOnHand).lessThanOrEqualTo(new D(p.reorderThreshold))) {
      alerts.push({
        kind: "low-product",
        message: `${p.name} is running low`,
        href: `/products/${p.id}`,
      });
    }
  }

  for (const b of expiring) {
    const days = Math.ceil((b.expiryDate!.getTime() - now.getTime()) / DAY);
    alerts.push({
      kind: "expiring",
      message: days < 0 ? `${b.batchNumber} has expired` : `${b.batchNumber} expires in ${days} days`,
      href: `/batches/${b.id}`,
    });
  }

  for (const s of unpaid) {
    alerts.push({
      kind: "unpaid",
      message: `${s.customer?.name ?? "A sale"} still owes on a sale from over 2 weeks ago`,
      href: `/sales/${s.id}`,
    });
  }

  return alerts;
}

/**
 * Estimated profit for the month: revenue − (cost of goods sold + expenses).
 * COGS comes from the unit cost captured on each sale line, so re-pricing
 * materials today never rewrites last month's profit.
 */
export async function getMonthSummary() {
  const from = startOfMonthLagos();

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { saleDate: { gte: from } },
      select: { totalAmount: true, items: { select: { quantity: true, unitCost: true } } },
    }),
    prisma.expense.aggregate({ where: { date: { gte: from } }, _sum: { amount: true } }),
  ]);

  const revenue = sales.reduce((sum, s) => sum.plus(new D(s.totalAmount)), new D(0));
  const cogs = sales.reduce(
    (sum, s) =>
      sum.plus(
        s.items.reduce((i, item) => i.plus(new D(item.quantity).times(new D(item.unitCost))), new D(0)),
      ),
    new D(0),
  );
  const expenseTotal = new D(expenses._sum.amount ?? 0);

  return {
    revenue: toNumber(money(revenue)),
    expenses: toNumber(money(expenseTotal)),
    profit: toNumber(money(revenue.minus(cogs).minus(expenseTotal))),
  };
}

export type ActivityItem = {
  id: string;
  kind: "sale" | "purchase" | "batch" | "expense";
  label: string;
  amount: number | null;
  at: Date;
  href: string;
};

/** Recent activity, plus the "last entry" nudge that keeps drift visible. */
export async function getRecentActivity(take = 8) {
  const [sales, purchases, batches, expenses] = await Promise.all([
    prisma.sale.findMany({
      orderBy: { saleDate: "desc" },
      take,
      include: { customer: { select: { name: true } } },
    }),
    prisma.rawMaterialPurchase.findMany({
      orderBy: { purchasedAt: "desc" },
      take,
      include: { rawMaterial: { select: { name: true } } },
    }),
    prisma.batch.findMany({
      orderBy: { producedAt: "desc" },
      take,
      include: { product: { select: { name: true } } },
    }),
    prisma.expense.findMany({ orderBy: { date: "desc" }, take }),
  ]);

  const items: ActivityItem[] = [
    ...sales.map((s) => ({
      id: s.id,
      kind: "sale" as const,
      label: s.customer?.name ? `Sale to ${s.customer.name}` : "Sale",
      amount: toNumber(s.totalAmount),
      at: s.saleDate,
      href: `/sales/${s.id}`,
    })),
    ...purchases.map((p) => ({
      id: p.id,
      kind: "purchase" as const,
      label: `Bought ${p.rawMaterial.name}`,
      amount: toNumber(p.totalCost),
      at: p.purchasedAt,
      href: `/purchases`,
    })),
    ...batches.map((b) => ({
      id: b.id,
      kind: "batch" as const,
      label: `Made ${b.product.name}`,
      amount: null,
      at: b.producedAt,
      href: `/batches/${b.id}`,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      kind: "expense" as const,
      label: e.category,
      amount: toNumber(e.amount),
      at: e.date,
      href: `/expenses`,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    items: items.slice(0, take),
    lastEntryAt: items[0]?.at ?? null,
    // FR-7: nothing logged in three days is itself worth flagging.
    isStale: items[0] ? Date.now() - items[0].at.getTime() > 3 * DAY : false,
  };
}
