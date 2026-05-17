# CTW 2.0 Operations Runbook

## Release

1. Confirm the release commit passed `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and the Playwright suite.
2. Apply database migrations explicitly with `pnpm db:migrate`.
3. Deploy API first and wait for `/readyz` to return `ok: true`.
4. Deploy worker and run `pnpm --filter @ctw/worker health`.
5. Deploy the web static service.
6. Send one Resend webhook test and one Twilio webhook test in the provider dashboards.

## Rollback

1. Roll back web first if the issue is UI-only.
2. Roll back worker before API if job processing is causing bad side effects.
3. Roll back API only after confirming the previous version is compatible with the current database schema.
4. Do not roll back a migration by editing production data manually; write and review a forward migration.

## Migrations And Seed

- Run migrations as an explicit release command, not from API or worker startup.
- Run `pnpm db:seed` only in local, review, or disposable demo environments.
- Run `pnpm db:reset` only against the seeded Northgate dataset.

## Provider Webhooks

- Resend inbound email: `/v1/webhooks/resend`.
- Twilio inbound SMS: `/v1/webhooks/twilio`.
- Production requires `CTW_PROVIDER_MODE=live`; fake providers are blocked by readiness in production.

## Health Checks

- API liveness: `/healthz`.
- API readiness: `/readyz`; checks runtime safety and the Prisma database connection when `CTW_DB_MODE=prisma`.
- Worker readiness: `pnpm --filter @ctw/worker health`; checks runtime safety, registered handlers, and pg-boss connectivity when `CTW_JOBS_MODE=pgboss`.
