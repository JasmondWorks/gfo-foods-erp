# PROJECT CONTEXT

## Spice & Food Processing — Business Management System

> Hand this to Claude Code as the starting brief. Read alongside `schema.prisma` and `build-spec.md`.

---

## 1. What we're building, in one paragraph

A single-user, mobile-first business management system (a lean, vertical ERP) for a small spice and food processing business. It tracks raw materials, production batches, finished goods, sales, and expenses in one connected system, so the owner can see her real stock levels and real profit without doing manual math. The entire product is the admin dashboard — there is no public-facing site, no customer portal, and no multi-user access.

---

## 2. Who it's for

**One user: the business owner.** She makes spice blends (and some other food products), buys raw materials in bulk, produces them in batches, packages them into different sizes, and sells to a mix of walk-in retail customers and repeat wholesale buyers. The business has one employee besides her.

She is **not technical**. She will use this on a **phone**, not a laptop, almost exclusively. She is busy actually making and selling product — every second of friction in this app competes directly with her real work.

---

## 3. The problem being solved

Today the business runs on memory and a notebook. Consequences:

- She doesn't know actual profit per product — packaging and material costs are never properly attributed
- She discovers she's out of an ingredient _mid-batch_, not before
- She has no reliable view of which products actually sell
- No batch traceability — if a customer complains, there's no way to know what went into that batch or when it was made
- Cash in and cash out live in her head, so "am I growing?" is a guess
- No basis for planning purchases — buying is reactive

The system turns the business from **reactive** to **proactive**: see problems before they happen, know the numbers without doing math.

---

## 4. The core domain model

The business has a real transformation step, which is what makes this a food-processing system rather than a generic shop tool:

```
Raw Materials  →  Recipe  →  Batch Production  →  Finished Goods  →  Sale  →  Money
   (buy)          (formula)     (make)              (stock)         (sell)   (reports)
```

**The chain of automatic deductions IS the product.** Everything else is CRUD forms around it:

- A **Purchase** increases raw material stock
- A **Batch** consumes raw materials per a **Recipe** and produces finished goods
- A **Sale** consumes finished goods and generates revenue
- **Reports** are derived entirely from the above — never entered

Stock levels, profit, and margins are always **computed, never typed**.

---

## 5. THE critical constraint (read this twice)

**The single biggest risk to this project is not technical — it's that she forgets to enter data.**

A system requiring disciplined daily entry from a busy one-person business will drift out of sync within weeks. Once the numbers are wrong, she stops trusting it. Once she stops trusting it, she abandons it entirely.

Every design decision must be evaluated against this. Which produces four hard rules:

### Rule 1 — Speed over completeness

Every entry action must be doable in **under 20 seconds on a phone**. More than 4 required fields in a form means the form is wrong. Recent items sort to the top of pickers. Quantity steppers, not keyboards. "Save & add another" everywhere.

### Rule 2 — Retroactive by default

Never assume real-time entry. She's mid-transaction with a customer; she is not opening the app. Design for **end-of-day or end-of-week catch-up**. Every form has a date picker defaulting to today but freely changeable to any past date.

### Rule 3 — Self-correcting, never brittle

Stock counts let her reset the system to physical reality, logging the variance. A missed entry creates a _temporary discrepancy_, never permanent data corruption. **Negative stock is allowed with a warning, never blocked** — if she bought materials without logging it and then logs a batch, a hard block leaves her stuck and blaming the software.

### Rule 4 — Derived over entered

She enters four things: purchases, batches, sales, expenses. That's it. Everything else the system computes.

### Priority hierarchy when trade-offs arise

If she logs sales and purchases but skips batches, inventory drifts but **her money picture stays accurate**. Money is what she cares about most. So: sales and expense entry are the highest-priority flows; batch logging is valuable but secondary.

---

## 6. Architecture decisions (already made — don't relitigate)

| Decision                                                                             | Rationale                                                                                                                                                       |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No landing page, no "app area" layer** — `/login` goes straight to `/` (dashboard) | One user, no public face, no roles. Every layer between login and the task is daily friction. The system _is_ the admin dashboard.                              |
| **No separate NestJS backend** — Next.js 15 App Router + server actions              | One user, one client, no external API consumers. A separate backend service is habit, not need. Keeps it a single deployable.                                   |
| **No multi-tenancy** — but keep data access behind a service layer                   | If this ever becomes a product for other food processors, adding `businessId` shouldn't be a rewrite. Don't implement it now; just don't make it painful later. |
| **Mobile-first, 375px**                                                              | She's on a phone. Desktop is the secondary case, not the primary.                                                                                               |
| **Single seeded user, long sessions (30 days)**                                      | Re-login is pure friction. No signup page.                                                                                                                      |

---

## 7. Stack

- **Next.js 15** (App Router, server actions for mutations)
- **PostgreSQL + Prisma**
- **Tailwind CSS** + shadcn/ui
- **Auth.js** (credentials provider) — single user, keep it simple
- **Recharts** for report visuals
- **Deploy:** Vercel + Neon/Supabase Postgres
- **Locale:** NGN currency, Africa/Lagos timezone, thousands separators
- **All money and quantities as `Decimal`** — never floats

---

## 8. Entities

Full schema in `schema.prisma`. Roles at a glance:

| Entity                        | What changes it                                          |
| ----------------------------- | -------------------------------------------------------- |
| `User`                        | Seeded once                                              |
| `RawMaterial`                 | ↑ purchases · ↓ batches · ↕ stock adjustments            |
| `RawMaterialPurchase`         | Manual entry                                             |
| `Product`                     | ↑ batches · ↓ sales · ↕ stock adjustments                |
| `Recipe` / `RecipeIngredient` | Set up once, edited rarely                               |
| `Batch`                       | Manual entry                                             |
| `BatchConsumption`            | Auto-generated by batch creation (traceability snapshot) |
| `Customer`                    | Optional, lightweight — walk-in sales need none          |
| `Sale` / `SaleItem`           | Manual entry                                             |
| `Expense`                     | Manual entry                                             |
| `StockAdjustment`             | Manual physical counts                                   |

**Stock integrity is absolute:** `quantityOnHand` is never directly editable through a form. It changes only through the flows above.

---

## 9. The one piece of logic that must be correct

Batch creation touches three tables and **must be a single database transaction**:

```ts
await prisma.$transaction(async (tx) => {
  const recipe = await tx.recipe.findUniqueOrThrow({
    where: { productId },
    include: { ingredients: true },
  });

  const scale = quantityMade / recipe.yieldQty;

  const batch = await tx.batch.create({
    data: {
      /* ...batchNumber, expiry... */
    },
  });

  for (const ing of recipe.ingredients) {
    const needed = ing.quantity * scale;

    await tx.rawMaterial.update({
      where: { id: ing.rawMaterialId },
      data: { quantityOnHand: { decrement: needed } },
    });

    // snapshot, NOT a reference to the live recipe — recipes change, history must not
    await tx.batchConsumption.create({
      data: {
        batchId: batch.id,
        rawMaterialId: ing.rawMaterialId,
        quantityUsed: needed,
      },
    });
  }

  await tx.product.update({
    where: { id: productId },
    data: { quantityOnHand: { increment: quantityMade } },
  });
});
```

Partial failure must roll back entirely. Inconsistent stock is the bug that quietly destroys trust over months of real use.

Sale recording follows the same pattern: create `Sale` + `SaleItem` rows, decrement each product's stock, compute total and payment status — atomically.

---

## 10. Page map

```
/login

/                        Dashboard — quick-entry buttons, alerts, month summary, last-entry nudge

/sales/new               ← highest priority screen
/purchases/new           ← highest priority screen
/batches/new             ← highest priority screen
/expenses/new            ← highest priority screen

/raw-materials           list · /[id] detail · /new · /[id]/edit
/purchases               list
/products                list · /[id] detail · /new · /[id]/edit
/products/[id]/recipe    recipe editor with live cost-per-unit
/batches                 list · /[id] detail (full traceability)
/sales                   list · /[id] detail
/customers               list · /[id] detail
/expenses                list
/stock-count             reconciliation · /history
/reports                 profit · product performance · material usage · low stock · outstanding · expiry
/settings
```

---

## 11. Build order

**Phase 1 — Foundation:** schema + migrations + seed · auth · protected layout + nav shell

**Phase 2 — Master data:** raw materials CRUD · products CRUD · recipe editor

**Phase 3 — The core loop (ship this to her):** log purchase · new batch (transaction logic) · new sale · add expense · dashboard with alerts

**Phase 4 — Trust & insight:** stock count · reports · customers · settings

**Phase 5 — Polish:** daily reminder nudge · CSV export · offline queueing

**Ship Phase 3 and let her use it for two weeks before building Phase 4.** What she actually touches tells you what to build next — and what to delete. If batch logging goes untouched for a month, that's data, not failure.

---

## 12. Definition of success

Not feature completeness. Success is:

1. She still uses it 8 weeks after launch
2. She can answer "which product makes me the most money?" in under 10 seconds
3. She stops running out of materials unexpectedly
4. The numbers are _roughly_ right, with occasional corrections — accounting-grade precision is explicitly a non-goal and chasing it makes the app unusable

---

## 13. Open questions to resolve with her before/during build

1. Does she sell the same blend in multiple package sizes? (Determines whether `Product` = blend, or blend × size)
2. Does she ever sell raw/unprocessed items directly, with no production step?
3. Recurring wholesale customers on credit, or mostly cash-and-carry?
4. Does she track expiry today, or would this system be introducing that discipline?
5. **Roughly how many sales a day?** — This is the important one. It determines whether per-sale entry or a daily-summary entry is the right primary flow, which shapes the single most-used screen in the app.

---

## 14. Wider context (why this project matters beyond one business)

This is also a deliberate first step into **vertical ERP for SMBs** as a niche. The strategic bet: SAP and Odoo are too heavy, too generic, and too expensive for small businesses, which currently run on Excel and WhatsApp. A lean, opinionated, vertical-specific system beats a configurable generic one at this scale.

So build it as a _real product for one user_, not a throwaway prototype — but resist premature generalization. Prove the pattern with one business first. The service-layer boundary in §6 is the only concession to a possible future multi-tenant version.
