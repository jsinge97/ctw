# CTW 2.0 Deployment

Recommended first deployment target: Railway. Keep API, worker, web, Postgres, and object storage as separate services so each process has a single responsibility and simple health checks.

## Services

- Postgres: primary database and pg-boss job storage.
- S3-compatible object storage: document originals and extracted artifacts.
- API: `pnpm --filter @ctw/api start`; health check `/readyz`.
- Worker: `pnpm --filter @ctw/worker start`; readiness command `pnpm --filter @ctw/worker health`.
- Web: build with `pnpm --filter @ctw/web build`; serve static output from `apps/web/dist`.

Use the repository `Dockerfile` for API and worker services. The checked-in `railway.json` defaults to the API service. Override the Railway service command per process:

- API: `pnpm --filter @ctw/api start`
- Worker: `pnpm --filter @ctw/worker start`
- Web static service: `pnpm --filter @ctw/web build` during build, then serve `apps/web/dist`

Do not run migrations or seed from the API or worker startup command. Run migrations as an explicit release step. Run seed only for local, review, or ephemeral demo environments.

## Required Environment

All services:

- `DATABASE_URL`
- `CTW_RUNTIME_MODE=production`
- `CTW_DB_MODE=prisma`
- `CTW_JOBS_MODE=pgboss`
- `CTW_PROVIDER_MODE=live`
- `CTW_STORAGE_MODE=s3`
- `CTW_ALLOW_DEMO_TOKENS=false`
- `APP_BASE_URL`
- `BETTER_AUTH_SECRET`
- `API_CORS_ORIGIN` for browser origins that call the API directly
- `SESSION_COOKIE_SAMESITE`
- `SESSION_COOKIE_SECURE`

API and worker provider/storage services:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `STORAGE_ENDPOINT`
- `STORAGE_BUCKET`
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`
- `STORAGE_REGION`

Web service:

- `VITE_API_BASE_URL` when the web origin calls a separate API origin directly. Leave blank only when the web and API are served behind the same origin or development proxy.

When the web and API are on different origins, set `API_CORS_ORIGIN` to the web origin and use secure cross-site cookies: `SESSION_COOKIE_SAMESITE=none` and `SESSION_COOKIE_SECURE=true`.

## Webhooks

- Resend inbound: `/v1/webhooks/resend`.
- Twilio inbound: `/v1/webhooks/twilio`.

## Release Steps

1. Provision Postgres.
2. Provision object storage and create the `STORAGE_BUCKET`.
3. Run `pnpm prisma:generate`.
4. Run `pnpm db:migrate`.
5. Deploy API with `/readyz` as the health check.
6. Deploy worker with `pnpm --filter @ctw/worker health` as the readiness command/check.
7. Deploy web with `APP_BASE_URL` pointing at the API/web origin.
8. Configure Resend and Twilio webhook URLs.

## Local Durable Seed

Use the seed lifecycle for local development, reviewer environments, and e2e setup:

```bash
docker compose up -d postgres minio
pnpm db:migrate
pnpm db:seed
```

The default local `DATABASE_URL` used by `pnpm db:*` is `postgresql://ctw:ctw@localhost:5432/ctw`, which matches `docker-compose.yml`.

The seed creates the Northgate CRE organization, admin/AM/VA/broker/client users, Sutter and Bryant deals, scoped external permissions, Resend/Twilio channels, documents, messages, one current next action, one VA queue item, routing review, approvals, and audit history.

Reset only the seeded Northgate dataset with:

```bash
pnpm db:reset
```

After migration and seed, run the durable local stack with:

```bash
docker compose up api worker web
```

The compose stack uses Prisma, pg-boss, MinIO-backed storage, fake providers, and cookie login. It does not allow demo bearer tokens.
