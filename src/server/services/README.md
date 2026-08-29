# Service layer

All data access goes through this folder. Route handlers, server actions and pages
must never call `prisma` directly.

Why: it is the single concession to a possible future multi-tenant version
(see PROJECT_CONTEXT §6). If `businessId` is ever introduced, it gets threaded
through these functions instead of through every page in the app.
