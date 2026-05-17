# Make It Real Demo Seams

This file tracks temporary demo seams that must disappear before production mode is considered real.

## Runtime Guardrails

- `CTW_RUNTIME_MODE=production` must use `CTW_DB_MODE=prisma`.
- `CTW_RUNTIME_MODE=production` must use `CTW_JOBS_MODE=pgboss`.
- `CTW_RUNTIME_MODE=production` must use `CTW_PROVIDER_MODE=live`.
- `CTW_RUNTIME_MODE=production` must set `CTW_ALLOW_DEMO_TOKENS=false`.

## Remaining Demo Seams

- Web runtime injects `am-token` in `apps/web/src/lib/api/runtime.ts`.
  - Removed by Task 5.
- API session service resolves hardcoded demo tokens in `apps/api/src/modules/session/session.service.ts`.
  - Replaced by durable Better Auth sessions in Task 4.
- API workflow services mostly read `getWorkflowProvider().memory`.
  - Replaced by Prisma repository calls in Tasks 6-9.
- `apps/api/src/modules/demo-store.ts` seeds in-memory deal state.
  - Replaced by durable seed/reset flow in Task 3 and Prisma services in Tasks 6-9.
- Provider functions in `packages/integrations` return deterministic fake IDs.
  - Replaced by real provider adapter boundaries in Task 10.
- Storage is not yet used for durable uploaded/attached document objects.
  - Replaced by durable S3-compatible storage in Task 11.
- Worker jobs currently perform deterministic placeholder transforms.
  - Replaced by Prisma-updating durable worker jobs in Task 12.
- Kanban uses local HTML drag/drop.
  - Replaced by `janhesters/shadcn-kanban-board` in Task 15.
- E2E tests do not yet reset and seed Postgres for every browser flow.
  - Replaced by seeded Postgres e2e in Task 16.
