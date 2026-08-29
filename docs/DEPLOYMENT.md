# Deployment

Target: **Vercel + Neon Postgres**, deployed from a GitHub repo so every push
ships itself.

Vercel project: `jasmondworks-projects/gfo-foods-admin` (already created and
linked — `.vercel/` is gitignored).

---

## Status

| Step | State |
| --- | --- |
| Vercel project created and linked | Done |
| `AUTH_SECRET` set for Production | Done |
| `vercel-build` runs migrations before the build | Done |
| Web manifest + icon for home-screen install | Done |
| GitHub repo created and connected | **Needs you** |
| Neon database provisioned | **Needs you** |
| `AUTH_SECRET` for Preview | Blocked on the Git repo |
| Seed the production database | Blocked on the database |
| Preview smoke test, then promote | Blocked on the above |

Preview environment variables cannot be set until a Git repository is
connected — Vercel rejects them with `does not have a connected Git
repository`. So the repo comes first.

---

## 1. Create the GitHub repo (you)

Create an **empty** repo — no README, no .gitignore, no licence, or the first
push will conflict. Then:

```bash
git remote add origin git@github.com:<you>/gfo-foods-admin.git
git push -u origin main
```

## 2. Connect it to Vercel (you)

Vercel dashboard → the `gfo-foods-admin` project → Settings → Git → connect
the repository. This is what unblocks preview environment variables.

## 3. Create the Neon database (you)

Vercel dashboard → Storage → Neon (Marketplace) → create, and attach it to
this project. Neon injects the connection strings automatically.

Confirm both of these exist afterwards, for Production **and** Preview:

- `DATABASE_URL` — the **pooled** connection string
- `DIRECT_URL` — the **direct** connection string

The schema needs both: the serverless runtime connects through the pooler,
but `prisma migrate deploy` cannot run through a transaction pooler. If Neon
only provides `DATABASE_URL`, copy the direct string in as `DIRECT_URL` by
hand.

> **Watch this:** if Preview and Production share one database, a preview
> deploy will run migrations against production data, because `vercel-build`
> runs `prisma migrate deploy`. Either give Preview its own Neon branch, or
> treat preview deploys as production-affecting.

## 4. Seed the owner account (me, once you've done the above)

The seed is deliberately not part of the build — it must run exactly once,
and it refuses to run without an explicit password.

```bash
DATABASE_URL="<production pooled url>" \
DIRECT_URL="<production direct url>" \
SEED_USER_EMAIL="her@email" \
SEED_USER_PASSWORD="<a real password>" \
npm run db:seed
```

Choose the password deliberately: there is no signup page and no password
reset flow yet, so changing it later means re-running this command.

## 5. Deploy a preview, smoke-test, then promote

```bash
npx vercel deploy          # preview URL
# smoke-test: login, log a sale, check the dashboard
npx vercel deploy --prod   # promote
```

---

## After it is live

- **Add to her home screen.** Open the production URL in Safari or Chrome on
  her phone → Share → Add to Home Screen. The manifest makes it open
  standalone, without browser chrome. A bookmark buried in tabs is its own
  kind of friction.
- **Sessions last 30 days**, so she should rarely see the login screen.
- **Watch the first fortnight, don't build.** Per PROJECT_CONTEXT §11, what
  she actually touches decides Phase 4 — and what to delete.
