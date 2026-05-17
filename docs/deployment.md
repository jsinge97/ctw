# CTW 2.0 Deployment

Recommended first deployment target: Railway.

## Services

- Postgres: primary database and pg-boss job storage.
- S3-compatible object storage: document originals and extracted artifacts.
- API: `pnpm --filter @ctw/api start`.
- Worker: `pnpm --filter @ctw/worker start`.
- Web: build with `pnpm --filter @ctw/web build`; serve static output from `apps/web/dist`.

Use the repository `Dockerfile` for API and worker services. Set the Railway service command per process:

- API: `pnpm --filter @ctw/api start`
- Worker: `pnpm --filter @ctw/worker start`
- Web static service: `pnpm --filter @ctw/web build` during build, then serve `apps/web/dist`

## Required Environment

- `DATABASE_URL`
- `CTW_RUNTIME_MODE=production`
- `CTW_DB_MODE=prisma`
- `CTW_JOBS_MODE=pgboss`
- `CTW_PROVIDER_MODE=live`
- `CTW_ALLOW_DEMO_TOKENS=false`
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
2. Provision object storage and create the `STORAGE_BUCKET`.
3. Run `pnpm prisma:generate`.
4. Run `pnpm db:migrate`.
5. Deploy API and worker with the same `DATABASE_URL`, `STORAGE_ENDPOINT`, and `STORAGE_BUCKET`.
6. Deploy web with `APP_BASE_URL` pointing at the API/web origin.
7. Configure Resend and Twilio webhook URLs.

## Local Durable Seed

Use the seed lifecycle for local development, reviewer environments, and e2e setup:

```bash
docker compose up -d postgres minio
pnpm db:migrate
pnpm db:seed
```

The seed creates the Northgate CRE organization, admin/AM/VA/broker/client users, Sutter and Bryant deals, scoped external permissions, Resend/Twilio channels, documents, messages, one current next action, one VA queue item, routing review, approvals, and audit history.

Reset only the seeded Northgate dataset with:

```bash
pnpm db:reset
```
