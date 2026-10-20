# GFO Foods — Business Management System

A single-user, mobile-first ERP for a spice and food processing business.
Tracks raw materials → recipes → production batches → finished goods → sales → money.

Specs live in [`docs/`](docs/): `PROJECT_CONTEXT.md` (the brief), `BUILD_SPEC.md`
(requirements), `SCHEMA.md` (data model).

## Getting started

```bash
npm install
cp .env.example .env      # then set AUTH_SECRET and SEED_USER_PASSWORD
npm run db:up             # Postgres 16 in Docker on port 5435
npm run db:migrate        # apply migrations
npm run db:seed           # owner account, expense categories, settings
npm run dev
```

Sign in at `/login` with `SEED_USER_EMAIL` / `SEED_USER_PASSWORD`. There is no
signup page — the single user is seeded.

## Scripts

| Command            | Does                                       |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Dev server                                 |
| `npm run build`    | Production build (typechecks)              |
| `npm run db:up`    | Start local Postgres                       |
| `npm run db:down`  | Stop local Postgres                        |
| `npm run db:migrate` | Create/apply a migration                 |
| `npm run db:seed`  | Seed owner, expense categories, settings   |
| `npm run db:reset` | Drop, re-migrate and re-seed               |
| `npm run db:studio`| Prisma Studio                              |

## Conventions

- **Server actions for all mutations.** No REST layer — one user, one client.
- **All data access goes through `src/server/services/`.** Pages and actions never
  call `prisma` directly, so a future `businessId` is threaded in one place.
- **Money and quantities are `Decimal`, never floats.** Helpers in `src/lib/decimal.ts`;
  serialise to numbers only at the client boundary.
- **Stock is never typed.** `quantityOnHand` changes only via purchase, batch,
  sale or stock adjustment.
- **Mobile-first at 375px.** Nothing tappable under 44px — the shadcn primitives in
  `src/components/ui/` are edited in place to a 44px default rather than wrapped.
- **Brand colour is `--primary`.** Don't introduce a parallel `--brand` token; use
  shadcn's semantic names (`primary`, `destructive`, `muted-foreground`), plus the
  `success` / `warning` tokens added for the alerts strip.
- **Negative stock is allowed with a warning, never blocked.**

## Status

Phases 1–3 complete — **this is the shippable build**:

- **Phase 1** — schema, migrations, seed, auth, protected shell
- **Phase 2** — raw materials CRUD, products CRUD, recipe editor with live cost-per-unit
- **Phase 3** — the core loop: log purchase, new batch, new sale, add expense,
  and the dashboard with alerts

Per PROJECT_CONTEXT §11, **ship this and let her use it for two weeks before
building Phase 4**. What she actually touches tells you what to build next —
and what to delete.

Phase 4 (stock count, reports, customers, settings) is deliberately not built yet.
# gfo-foods-erp
