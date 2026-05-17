# Make It Real Demo Seams

This file tracks temporary demo seams that must disappear before production mode is considered real.

## Runtime Guardrails

- `CTW_RUNTIME_MODE=production` must use `CTW_DB_MODE=prisma`.
- `CTW_RUNTIME_MODE=production` must use `CTW_JOBS_MODE=pgboss`.
- `CTW_RUNTIME_MODE=production` must use `CTW_PROVIDER_MODE=live`.
- `CTW_RUNTIME_MODE=production` must set `CTW_ALLOW_DEMO_TOKENS=false`.

## Completed Seams

- Web login no longer injects `am-token`; it signs in through `/v1/session/login` and uses cookie credentials.
- Workflow services are wired through Prisma repositories when `CTW_DB_MODE=prisma`.
- `docker compose up api worker web` now uses Prisma, pg-boss, MinIO-backed storage, fake providers, and no demo bearer tokens.
- Provider functions call Resend and Twilio in live mode and return deterministic IDs only in fake mode.
- Document upload and filing write through the storage boundary.
- Worker jobs update durable workflow state.
- Kanban uses the local `components/ui/kanban.tsx` adaptation of `janhesters/shadcn-kanban-board`.
- Browser E2E starts the app with seeded Postgres in `playwright.config.ts`.

## Remaining Intentional Non-Production Seams

- API session service still supports hardcoded demo bearer tokens only when runtime mode is non-production and `CTW_ALLOW_DEMO_TOKENS=true`.
- API login creates app-owned `auth_sessions` rows with the Better Auth cookie name; production credential login remains disabled until a real Better Auth credential/provider flow is configured.
- `apps/api/src/modules/demo-store.ts` remains for explicit non-production memory/demo mode only.
- Fake providers and memory storage remain available for local tests and demos, but production readiness rejects them.
