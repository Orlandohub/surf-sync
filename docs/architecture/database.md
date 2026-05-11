# Database

SurfSync uses Neon Postgres with Drizzle ORM.

## Filesystem

- `lib/db/index.ts` exports the shared Drizzle client.
- `lib/db/schema/auth.ts` contains Better Auth tables and SurfSync user fields.
- `lib/db/schema/app.ts` contains SurfSync MVP product tables.
- `drizzle/` contains generated SQL migrations and Drizzle metadata.
- `scripts/seed.ts` seeds stable reference data.
- `lib/services/database-smoke.ts` provides a service-layer smoke helper that verifies read/write coverage across the MVP tables inside a rolled-back transaction.

## Workflow

- Generate migrations with `pnpm db:generate`.
- Apply generated migrations to fresh branches with `pnpm db:migrate`.
- Use `pnpm db:push` only for local/preview branch synchronization while schema is still actively changing.
- Seed launch reference data with `pnpm db:seed`.
- Verify table read/write behavior with `pnpm db:smoke`.

## Current Baseline

The initial migration is a full schema baseline for new Neon branches.

The current development branch had Better Auth tables created before migrations were introduced, so it was synchronized with `pnpm db:push`. Fresh branches should use the migration workflow from the beginning.

## Seed Data

The launch `location` rows are:

- Cascais
- Costa da Caparica
- Ericeira

All three are in the `Lisbon area` region.
