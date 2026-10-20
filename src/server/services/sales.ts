import { PaymentStatus } from "@prisma/client";
import { D, money, qty, toNumber, type Decimal } from "@/lib/decimal";
import { prisma } from "@/lib/prisma";
import { materialCostPerUnit } from "@/server/services/recipes";
import type { SaleInput } from "@/server/validation/entries";

export function paymentStatusFor(total: Decimal, paid: Decimal): PaymentStatus {
  if (paid.greaterThanOrEqualTo(total)) return PaymentStatus.PAID;
  if (paid.lessThanOrEqualTo(0)) return PaymentStatus.UNPAID;
  return PaymentStatus.PARTIAL;
}

/**
 * FR-5. Create the sale and its lines, decrement each product's stock, and
 * derive the total and payment status — atomically, same as batch production.
 *
 * Each line stores the material cost per unit at the time of sale, so the profit
 * report reflects what the goods actually cost rather than what materials happen
 * to cost today.
 */
export async function recordSale(input: SaleInput) {
  return prisma.$transaction(async (tx) => {
    let customerId: string | null = null;
    if (input.customerName) {
      // Find-or-create keeps credit tracking to a single optional field.
      const existing = await tx.customer.findFirst({
        where: { name: { equals: input.customerName, mode: "insensitive" } },
        select: { id: true },
      });
      customerId =
        existing?.id ?? (await tx.customer.create({ data: { name: input.customerName } })).id;
    }

    const products = await tx.product.findMany({
      where: { id: { in: input.items.map((i) => i.productId) } },
      include: { recipe: { include: { ingredients: { include: { rawMaterial: true } } } } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const lines = input.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new Error("That product no longer exists.");

      const quantity = qty(item.quantity);
      const unitPrice = money(item.unitPrice);
      const unitCost = product.recipe
        ? materialCostPerUnit(product.recipe.ingredients, product.recipe.yieldQty)
        : new D(0);

      return {
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice,
        lineTotal: money(quantity.times(unitPrice)),
        unitCost,
        available: new D(product.quantityOnHand),
      };
    });

    const totalAmount = money(lines.reduce((sum, l) => sum.plus(l.lineTotal), new D(0)));
    // Blank means "paid in full" — the common case shouldn't need typing.
    const amountPaid = input.amountPaid === null ? totalAmount : money(input.amountPaid);

    const sale = await tx.sale.create({
      data: {
        customerId,
        saleDate: input.saleDate,
        totalAmount,
        amountPaid,
        paymentStatus: paymentStatusFor(totalAmount, amountPaid),
        notes: input.notes,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
            unitCost: l.unitCost,
          })),
        },
      },
    });

    // Same rule as batches: short stock warns, never blocks (FR-4).
    const shortages: { name: string; needed: number; available: number }[] = [];
    for (const line of lines) {
      if (line.available.lessThan(line.quantity)) {
        shortages.push({
          name: line.name,
          needed: toNumber(line.quantity),
          available: toNumber(line.available),
        });
      }
      await tx.product.update({
        where: { id: line.productId },
        data: { quantityOnHand: { decrement: line.quantity } },
      });
    }

    return { saleId: sale.id, totalAmount: toNumber(totalAmount), shortages };
  });
}

export async function listSales({ take = 50 }: { take?: number } = {}) {
  const sales = await prisma.sale.findMany({
    orderBy: { saleDate: "desc" },
    take,
    include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
  });

  return sales.map((s) => ({
    id: s.id,
    saleDate: s.saleDate,
    customerName: s.customer?.name ?? null,
    totalAmount: toNumber(s.totalAmount),
    amountPaid: toNumber(s.amountPaid),
    paymentStatus: s.paymentStatus,
    itemCount: s._count.items,
  }));
}

export async function getSale(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: { include: { product: { select: { name: true, packageSize: true } } } },
    },
  });
  if (!sale) return null;

  const totalAmount = new D(sale.totalAmount);
  const amountPaid = new D(sale.amountPaid);

  return {
    id: sale.id,
    saleDate: sale.saleDate,
    customer: sale.customer,
    notes: sale.notes,
    totalAmount: toNumber(totalAmount),
    amountPaid: toNumber(amountPaid),
    outstanding: toNumber(money(totalAmount.minus(amountPaid))),
    paymentStatus: sale.paymentStatus,
    items: sale.items.map((i) => ({
      id: i.id,
      name: i.product.name,
      packageSize: i.product.packageSize,
      quantity: toNumber(i.quantity),
      unitPrice: toNumber(i.unitPrice),
      lineTotal: toNumber(i.lineTotal),
    })),
  };
}

/** Records a payment against an outstanding sale, re-deriving the status. */
export async function recordPayment(saleId: string, amount: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUniqueOrThrow({
      where: { id: saleId },
      select: { totalAmount: true, amountPaid: true },
    });

    const total = new D(sale.totalAmount);
    const paid = money(new D(sale.amountPaid).plus(new D(amount)));

    if (paid.greaterThan(total)) {
      throw new Error("That payment would exceed the amount owed on this sale.");
    }

    return tx.sale.update({
      where: { id: saleId },
      data: { amountPaid: paid, paymentStatus: paymentStatusFor(total, paid) },
    });
  });
}

/** Products ordered by how recently they sold — the picker's top entries. */
export async function listProductsByRecency() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      packageSize: true,
      sellingPrice: true,
      quantityOnHand: true,
      saleItems: {
        orderBy: { sale: { saleDate: "desc" } },
        take: 1,
        select: { sale: { select: { saleDate: true } } },
      },
    },
  });

  return products
    .map((p) => ({
      id: p.id,
      name: p.name,
      packageSize: p.packageSize,
      sellingPrice: toNumber(p.sellingPrice),
      quantityOnHand: toNumber(p.quantityOnHand),
      lastSold: p.saleItems[0]?.sale.saleDate ?? null,
    }))
    .sort((a, b) => {
      if (a.lastSold && b.lastSold) return b.lastSold.getTime() - a.lastSold.getTime();
      if (a.lastSold) return -1;
      if (b.lastSold) return 1;
      return a.name.localeCompare(b.name);
    });
}
