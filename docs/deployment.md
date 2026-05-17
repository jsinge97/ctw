# CTW 2.0 Deployment

Recommended first deployment target: Railway.

## Services

- Postgres: primary database and pg-boss job storage.
- API: `pnpm --filter @ctw/api start`.
- Worker: `pnpm --filter @ctw/worker start`.
- Web: build with `pnpm --filter @ctw/web build`; serve static output from `apps/web/dist`.

Use the repository `Dockerfile` for API and worker services. Set the Railway service command per process:

- API: `pnpm --filter @ctw/api start`
- Worker: `pnpm --filter @ctw/worker start`
- Web static service: `pnpm --filter @ctw/web build` during build, then serve `apps/web/dist`

## Required Environment

- `DATABASE_URL`
- `CTW_DB_MODE=prisma`
- `CTW_JOBS_MODE=pgboss`
- `APP_BASE_URL`
- `BETTER_AUTH_SECRET`
- `RESEND_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `STORAGE_ENDPOINT`
- `STORAGE_BUCKET`

## Webhooks

- Resend inbound: `/v1/webhooks/resend`.
- Twilio inbound: `/v1/webhooks/twilio`.

## Release Steps

1. Provision Postgres.
2. Run `pnpm prisma:generate`.
3. Run `pnpm db:migrate`.
4. Deploy API and worker with the same `DATABASE_URL`.
5. Deploy web with `APP_BASE_URL` pointing at the API/web origin.
6. Configure Resend and Twilio webhook URLs.
