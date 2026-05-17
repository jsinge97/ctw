# CTW 2.0 Make It Real Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace CTW 2.0 demo-mode seams with durable auth, durable Prisma-backed workflow state, real provider boundaries, and usable CRUD surfaces.

**Architecture:** Keep the existing TypeScript monorepo shape. The API remains Fastify plus Zod contracts plus generated OpenAPI client, but all workflow services move behind Prisma repositories instead of in-memory demo state. The web app keeps the AI frontend scaffolding pattern: generated API client, adapters/hooks, URL-backed routes, and dumb components.

**Tech Stack:** pnpm, turbo, TypeScript, Fastify, Zod, OpenAPI, Prisma, PostgreSQL, Better Auth, pg-boss, Resend, Twilio, S3-compatible storage, Vite, React, TanStack Router, TanStack Query, TanStack Table, shadcn/ui, `janhesters/shadcn-kanban-board`, Vitest, Playwright.

---

## Source Docs

Read these before starting, and re-read the relevant sections at the start of each task:

- `AGENTS.md` once Task 1 creates it
- `CLAUDE.md` once Task 1 creates it
- `docs/feature-plan.md`
- `docs/crud-model.md`
- `docs/data-model.md`
- `docs/architecture.md`
- `docs/screens.md`
- `docs/frontend-architecture.md`
- `docs/design-system.md`
- `docs/deployment.md`
- `docs/plans/2026-05-17-ctw-2-implementation-plan.md`

Current known demo seams to remove:

- Web login injects `am-token` in `apps/web/src/lib/api/runtime.ts`.
- API sessions are resolved from hardcoded tokens in `apps/api/src/modules/session/session.service.ts`.
- Most API services use `getWorkflowProvider().memory`, which points at `apps/api/src/modules/demo-store.ts`.
- Prisma schema and repository boundaries exist, but most workflow commands are not durable.
- Kanban drag/drop is local HTML drag/drop, not `janhesters/shadcn-kanban-board`.
- Provider integrations return deterministic fake IDs unless wired through environment-backed clients.
- E2E tests use injected Fastify and browser smoke checks, but not a fully seeded Postgres lifecycle.

## Execution Rules

- Work task-by-task in order unless a dependency forces a small reorder.
- Start each task with tests that fail against the current demo behavior.
- Commit after every task using the commit message listed in the task.
- Keep commits small; do not batch unrelated tasks.
- After each milestone, request one subagent review. Use the same reviewer for up to five passes for that milestone.
- Do not remove demo-mode support until durable dev/test seed flows exist.
- Do not introduce AI writes directly to database tables. AI/provider work must create typed proposed records or drafts that app workflows apply.
- Every meaningful mutation must write audit history.
- If a task cannot be completed cleanly, update this plan with the blocker before moving on.

## Milestones

1. [x] Agent docs, reality guardrails, and local data lifecycle.
2. [x] Real Better Auth sessions and role-aware login.
3. [x] Durable Prisma workflow services.
4. [x] Real ingestion, storage, providers, and worker runtime.
5. [ ] Real CRUD surfaces and kanban component.
6. [ ] Production-grade e2e, deployment, and docs.

---

## Task 1: Agent Source-of-Truth Docs

**Status:** Done in `232cf4c`.

**Purpose:** Give future agents and humans one obvious place to find the source docs, execution rules, and important commands before they touch code.

**Files:**

- Create: `AGENTS.md`
- Create: `CLAUDE.md`
- Modify: `docs/plans/2026-05-17-make-it-real-implementation-plan.md`

**`AGENTS.md` must include:**

- Read these source-of-truth docs before coding:
  - `docs/feature-plan.md`
  - `docs/crud-model.md`
  - `docs/data-model.md`
  - `docs/architecture.md`
  - `docs/screens.md`
  - `docs/frontend-architecture.md`
  - `docs/design-system.md`
  - `docs/deployment.md`
  - `docs/plans/2026-05-17-ctw-2-implementation-plan.md`
  - `docs/plans/2026-05-17-make-it-real-implementation-plan.md`
- Commit after each completed task.
- After each milestone, request subagent review before moving on.
- Do not let production run demo tokens, memory workflow, or fake providers.
- Every meaningful mutation writes audit history.
- App owns writes; AI/provider work creates typed proposed records or drafts only.
- Do not edit generated OpenAPI/client by hand.
- Do not revert user changes.

**`CLAUDE.md` must include command quick reference:**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @ctw/api test
pnpm --filter @ctw/web test
pnpm --filter @ctw/web e2e
pnpm --filter @ctw/worker test
pnpm prisma:generate
pnpm db:generate
pnpm db:migrate
pnpm openapi:generate
pnpm client:generate
pnpm build
docker compose up -d postgres minio
docker compose config
```

It must also document the expected local durable flow once Task 2 exists:

```bash
docker compose up -d postgres minio
pnpm db:migrate
pnpm db:seed
pnpm --filter @ctw/api dev
pnpm --filter @ctw/web dev
```

**Steps:**

1. Create `AGENTS.md` with source docs, execution rules, and safety rules.
2. Create `CLAUDE.md` with command quick reference and local runbook.
3. Add a note to this plan's Source Docs section that `AGENTS.md` and `CLAUDE.md` are required onboarding docs.
4. Run:

```bash
pnpm typecheck
```

5. Commit:

```bash
git add AGENTS.md CLAUDE.md docs/plans/2026-05-17-make-it-real-implementation-plan.md
git commit -m "docs: add agent source of truth docs"
```

---

## Task 2: Demo Seam Guardrails

**Status:** Done in `0f582e7`.

**Purpose:** Make demo-only paths explicit so they cannot accidentally remain in production.

**Files:**

- Modify: `packages/config/src/env.ts`
- Modify: `.env.example`
- Modify: `apps/api/src/modules/workflow-provider.ts`
- Test: `packages/config/src/env.test.ts`
- Test: `apps/api/src/modules/workflow-provider.test.ts`
- Create: `docs/plans/make-it-real-seams.md`

**Steps:**

1. Add a config field `CTW_RUNTIME_MODE` with allowed values `demo`, `test`, `production`.
2. Add tests proving `production` rejects memory workflow mode, demo tokens, and fake providers.
3. Update `workflow-provider.ts` so `memory` mode is allowed only when `CTW_RUNTIME_MODE !== "production"`.
4. Write `docs/plans/make-it-real-seams.md` listing every temporary demo seam and the task that removes it.
5. Run:

```bash
pnpm --filter @ctw/config test
pnpm --filter @ctw/api test -- workflow-provider
pnpm typecheck
```

6. Commit:

```bash
git add packages/config apps/api/src/modules/workflow-provider.ts docs/plans/make-it-real-seams.md .env.example
git commit -m "chore: add runtime mode guardrails"
```

---

## Task 3: Database Seed and Reset Lifecycle

**Status:** Done.

**Purpose:** Give local dev, Playwright, and reviewers a real Postgres-backed dataset instead of `demo-store.ts`.

**Files:**

- Create: `packages/db/src/seed.ts`
- Create: `packages/db/src/reset.ts`
- Create: `packages/db/src/seed.test.ts`
- Modify: `packages/db/package.json`
- Modify: `package.json`
- Modify: `docker-compose.yml`
- Modify: `docs/deployment.md`

**Seed must create:**

- Organization `Northgate CRE`.
- Users and memberships for admin, AM, VA, broker, and client.
- Contacts and companies linked to broker/client users.
- Deals equivalent to the current Sutter and Bryant fixtures.
- Participants and permission grants that match the current demo behavior.
- Messages, documents, current next action, VA work item, routing review item, audit events.
- Channels for Resend email and Twilio SMS.

**Steps:**

1. Write seed tests that reset a test database and assert the expected users, memberships, deals, permissions, and current next action exist.
2. Implement `pnpm --filter @ctw/db db:reset` and `pnpm --filter @ctw/db db:seed`.
3. Add root scripts `db:reset` and `db:seed`.
4. Document the local flow:

```bash
docker compose up -d postgres minio
pnpm db:migrate
pnpm db:seed
```

5. Run:

```bash
pnpm --filter @ctw/db test -- seed
pnpm prisma:generate
pnpm db:generate
pnpm typecheck
```

6. Commit:

```bash
git add package.json packages/db docker-compose.yml docs/deployment.md
git commit -m "feat: add durable seed data lifecycle"
```

---

## Task 4: Better Auth Database Integration

**Status:** Done.

**Purpose:** Replace hardcoded bearer-token sessions with Better Auth-backed users and sessions.

**Files:**

- Modify: `packages/auth/src/better-auth.ts`
- Modify: `packages/auth/src/context.ts`
- Create: `packages/auth/src/session.ts`
- Test: `packages/auth/src/session.test.ts`
- Modify: `apps/api/src/modules/session/session.service.ts`
- Modify: `apps/api/src/modules/authz.ts`
- Modify: `apps/api/src/modules/session/session.routes.ts`
- Test: `apps/api/src/modules/session/session.integration.test.ts`
- Test: `apps/api/src/modules/authz.integration.test.ts`

**Behavior:**

- Session lookup reads real Better Auth session/cookie state.
- API request context resolves user, active organization, membership, role defaults, and explicit permission grants from Prisma.
- Demo bearer tokens remain allowed only in `CTW_RUNTIME_MODE=demo` or `test`.
- `/v1/session/current` returns the current durable user/session.
- `/v1/session/accept-invitation` no longer accepts arbitrary demo strings in production.

**Steps:**

1. Write failing tests for:
   - cookie-backed AM session resolves to Maria Reyes.
   - broker session sees only participant deals.
   - production mode rejects demo bearer tokens.
2. Implement Better Auth config and session resolver.
3. Update auth middleware to prefer real session, then test/demo token only outside production.
4. Run:

```bash
pnpm --filter @ctw/auth test
pnpm --filter @ctw/api test -- session authz
pnpm typecheck
```

5. Commit:

```bash
git add packages/auth apps/api/src/modules/session apps/api/src/modules/authz.ts
git commit -m "feat: wire durable auth sessions"
```

---

## Task 5: Web Login and Session Runtime

**Status:** Done.

**Purpose:** Replace hardcoded `am-token` in the web app with real session-aware login/logout.

**Files:**

- Modify: `apps/web/src/lib/api/runtime.ts`
- Modify: `apps/web/src/lib/api/adapters/session.ts`
- Modify: `apps/web/src/hooks/use-current-session.ts`
- Modify: `apps/web/src/routes/login.tsx`
- Modify: `apps/web/src/components/app-shell.tsx`
- Test: `apps/web/src/routes/login.test.tsx`
- Test: `apps/web/e2e/browser/app-shell.spec.ts`

**Behavior:**

- Login form submits to the real auth endpoint.
- API client sends cookies/credentials, not demo bearer token.
- App shell shows actual current session.
- Sign out clears session and routes to `/login`.
- Home route redirects by role: VA to `/va`, others to `/deals`.

**Steps:**

1. Write route/component tests for login submit, login error, and sign out.
2. Update API runtime to use `credentials: "include"`.
3. Update browser e2e to log in through the UI using seeded AM credentials.
4. Run:

```bash
pnpm --filter @ctw/web test
pnpm --filter @ctw/web e2e:browser
pnpm typecheck
```

5. Commit:

```bash
git add apps/web/src apps/web/e2e/browser
git commit -m "feat: replace demo login with real session flow"
```

---

## Milestone 1 Review

Request one subagent review before continuing.

Review focus:

- production cannot use demo tokens or memory workflow by accident.
- seed data is enough for local dev and e2e.
- login/session behavior is real, role-aware, and test-covered.

---

## Task 6: Prisma Workflow Repository Coverage

**Status:** Done.

**Purpose:** Make the Prisma repository cover every object that currently comes from `demo-store.ts`.

**Files:**

- Modify: `packages/db/src/repositories/workflow.repository.ts`
- Test: `packages/db/src/repositories/workflow.repository.test.ts`
- Modify: `packages/db/src/index.ts`

**Repository methods to add:**

- Organizations/settings: get/update routing threshold, channels.
- Users/memberships: list users, invite user, update user status/role.
- Deals: create, get, list, patch, move stage, archive.
- Participants: list, add, update, remove.
- Messages: list, create inbound, create outbound, update visibility/status, reassign.
- Documents: list, create from attachment/upload, update metadata, archive.
- Tasks: list, create, set current next action, decide, route, complete.
- Routing review: list open, create, resolve.
- VA work: list scoped, create, start, submit, accept, send back, cancel.
- Activity/audit: list deal activity.

**Steps:**

1. Write repository tests against seeded Postgres or Prisma test transaction.
2. Implement methods with Prisma transactions for multi-object writes.
3. Ensure every method accepts `organizationId` and never leaks cross-org rows.
4. Run:

```bash
pnpm --filter @ctw/db test -- workflow.repository
pnpm --filter @ctw/db typecheck
```

5. Commit:

```bash
git add packages/db/src/repositories/workflow.repository.ts packages/db/src/repositories/workflow.repository.test.ts packages/db/src/index.ts
git commit -m "feat: complete prisma workflow repository"
```

---

## Task 7: Durable Deals, Participants, Users, Settings APIs

**Status:** Done.

**Purpose:** Move core CRUD APIs from memory arrays to Prisma repositories.

**Files:**

- Modify: `apps/api/src/modules/workflow-provider.ts`
- Modify: `apps/api/src/modules/deals/deals.service.ts`
- Modify: `apps/api/src/modules/participants/participants.service.ts`
- Modify: `apps/api/src/modules/users/users.service.ts`
- Modify: `apps/api/src/modules/settings/settings.service.ts`
- Test: `apps/api/src/modules/deals/deals.integration.test.ts`
- Test: `apps/api/src/modules/participants/participants.integration.test.ts`
- Test: `apps/api/src/modules/users/users.integration.test.ts`
- Test: `apps/api/src/modules/settings/settings.integration.test.ts`

**Behavior:**

- `CTW_DB_MODE=prisma` is the default outside `CTW_RUNTIME_MODE=demo`.
- Deal creation, edits, stage moves, archives, participants, user invites, role changes, and organization settings are durable.
- Every mutation writes audit history.
- Broker/client permission checks use real participants and permission grants.

**Steps:**

1. Write integration tests that run with Prisma mode and seeded data.
2. Update services to call Prisma repository methods.
3. Keep memory adapter only for explicit demo/test mode.
4. Run:

```bash
CTW_DB_MODE=prisma pnpm --filter @ctw/api test -- deals participants users settings
pnpm typecheck
```

5. Commit:

```bash
git add apps/api/src/modules packages/db/src/repositories
git commit -m "feat: persist core crud APIs with prisma"
```

---

## Task 8: Durable Messages, Documents, Routing Review APIs

**Status:** Done.

**Purpose:** Make channel filing and document state durable.

**Files:**

- Modify: `apps/api/src/modules/messages/messages.service.ts`
- Modify: `apps/api/src/modules/documents/documents.service.ts`
- Modify: `apps/api/src/modules/routing-review/routing-review.service.ts`
- Modify: `apps/api/src/modules/webhooks/inbound-routing.service.ts`
- Test: `apps/api/src/modules/messages/messages.integration.test.ts`
- Test: `apps/api/src/modules/documents/documents.integration.test.ts`
- Test: `apps/api/src/modules/routing-review/routing-review.integration.test.ts`
- Test: `apps/api/src/modules/webhooks/webhooks.integration.test.ts`

**Behavior:**

- Inbound email/SMS creates durable messages.
- Low-confidence route creates durable routing review item.
- Routing review resolution updates durable message deal/status.
- Attachments create durable documents and versions.
- Document classification status can update asynchronously.
- Message hide/redact/reassign writes audit events.

**Steps:**

1. Write tests using a seeded deal and posted webhook payload.
2. Implement durable service paths.
3. Ensure original source metadata is preserved.
4. Run:

```bash
CTW_DB_MODE=prisma pnpm --filter @ctw/api test -- messages documents routing-review webhooks
pnpm typecheck
```

5. Commit:

```bash
git add apps/api/src/modules/messages apps/api/src/modules/documents apps/api/src/modules/routing-review apps/api/src/modules/webhooks packages/db/src/repositories
git commit -m "feat: persist channel filing workflows"
```

---

## Task 9: Durable Tasks, Next Action, VA Work, Audit

**Status:** Done.

**Purpose:** Make the main work execution loop durable end to end.

**Files:**

- Modify: `apps/api/src/modules/tasks/tasks.service.ts`
- Modify: `apps/api/src/modules/va-work/va-work.service.ts`
- Modify: `apps/api/src/modules/activity/activity.service.ts`
- Modify: `apps/api/src/modules/audit/audit.service.ts`
- Test: `apps/api/src/modules/tasks/tasks.integration.test.ts`
- Test: `apps/api/src/modules/va-work/va-work.integration.test.ts`
- Test: `apps/api/src/modules/activity/activity.integration.test.ts`
- Test: `apps/api/src/modules/audit/audit.service.test.ts`

**Behavior:**

- Exactly one active current next action per deal.
- Approve/edit/reject/defer/route decisions are durable.
- System outbound approval creates durable outbound message, approval event, task outcome, and audit event.
- VA queue lifecycle is durable and role-scoped.
- Activity combines audit, routing, approval, and task outcomes without leaking internal events to external users.

**Steps:**

1. Write tests for current-next-action uniqueness and VA state transitions.
2. Implement service methods through Prisma repository transactions.
3. Run:

```bash
CTW_DB_MODE=prisma pnpm --filter @ctw/api test -- tasks va-work activity audit
pnpm typecheck
```

4. Commit:

```bash
git add apps/api/src/modules/tasks apps/api/src/modules/va-work apps/api/src/modules/activity apps/api/src/modules/audit packages/db/src/repositories
git commit -m "feat: persist task and va workflows"
```

---

## Milestone 2 Review

**Status:** Done after three reviewer passes.

Request one subagent review before continuing.

Review focus:

- no API service uses `getWorkflowProvider().memory` except demo/test adapter code.
- all core mutations are durable and audited.
- permission scoping is enforced in Prisma mode.
- no cross-organization leakage.

---

## Task 10: Real Provider Adapters

**Status:** Done.

**Purpose:** Replace deterministic fake provider functions with environment-backed provider clients behind testable adapters.

**Files:**

- Modify: `packages/integrations/src/outbound-email.ts`
- Modify: `packages/integrations/src/outbound-sms.ts`
- Modify: `packages/integrations/src/resend.ts`
- Modify: `packages/integrations/src/twilio.ts`
- Create: `packages/integrations/src/providers.ts`
- Test: `packages/integrations/src/providers.test.ts`
- Modify: `packages/config/src/env.ts`
- Modify: `.env.example`

**Behavior:**

- `CTW_PROVIDER_MODE=fake` works in local/test only.
- `CTW_PROVIDER_MODE=live` requires Resend and Twilio credentials.
- Outbound send returns provider message ID and raw provider metadata.
- Inbound webhook validators preserve raw payload metadata.

**Steps:**

1. Write tests for fake mode, live-mode missing-env failure, Resend payload normalization, Twilio payload normalization.
2. Implement adapter interfaces:
   - `EmailProvider.sendOutbound`.
   - `SmsProvider.sendOutbound`.
   - `InboundEmailNormalizer`.
   - `InboundSmsNormalizer`.
3. Update task approval service to use provider factory injection.
4. Run:

```bash
pnpm --filter @ctw/integrations test
pnpm --filter @ctw/api test -- tasks webhooks
pnpm typecheck
```

5. Commit:

```bash
git add packages/integrations packages/config .env.example apps/api/src/modules/tasks apps/api/src/modules/webhooks
git commit -m "feat: add real provider adapter boundaries"
```

---

## Task 11: Real Storage and Attachment Filing

**Status:** Done.

**Purpose:** Store uploaded/attached documents in S3-compatible storage and create durable document versions.

**Files:**

- Modify: `packages/storage/src/storage.ts`
- Test: `packages/storage/src/storage.test.ts`
- Modify: `apps/api/src/modules/documents/documents.routes.ts`
- Modify: `apps/api/src/modules/documents/documents.service.ts`
- Modify: `apps/api/src/modules/webhooks/inbound-routing.service.ts`
- Test: `apps/api/src/modules/documents/documents.integration.test.ts`
- Test: `apps/api/src/modules/webhooks/webhooks.integration.test.ts`

**Behavior:**

- Document upload stores object and creates `document_versions`.
- Email attachments store original object and create documents after message filing.
- Storage abstraction supports fake local memory/test mode and S3-compatible live mode.
- Document body/object keys are never exposed to unauthorized users.

**Steps:**

1. Add fake storage tests and S3 config validation tests.
2. Implement multipart upload route for documents.
3. Extend Resend webhook normalization to include attachment metadata if present.
4. Run:

```bash
pnpm --filter @ctw/storage test
CTW_DB_MODE=prisma pnpm --filter @ctw/api test -- documents webhooks
pnpm typecheck
```

5. Commit:

```bash
git add packages/storage apps/api/src/modules/documents apps/api/src/modules/webhooks
git commit -m "feat: store document files durably"
```

---

## Task 12: Worker Job Processing Against Prisma

**Status:** Done.

**Purpose:** Make workers process durable jobs and update durable records.

**Files:**

- Modify: `apps/worker/src/runtime.ts`
- Modify: `apps/worker/src/jobs/ingest-email.ts`
- Modify: `apps/worker/src/jobs/ingest-twilio.ts`
- Modify: `apps/worker/src/jobs/classify-document.ts`
- Modify: `apps/worker/src/jobs/extract-document-text.ts`
- Modify: `apps/worker/src/jobs/propose-next-action.ts`
- Modify: `apps/worker/src/jobs/generate-system-draft.ts`
- Test: `apps/worker/src/runtime.integration.test.ts`
- Test: `apps/worker/src/jobs/*.test.ts`
- Modify: `packages/jobs/src/jobs.ts`

**Behavior:**

- pg-boss job handlers update Prisma state.
- Email/SMS ingest can be queued or run inline for tests.
- Document classification updates `classificationStatus` and `documentType`.
- OCR/extraction updates document version artifacts.
- Next-action proposal creates typed proposed task records, not direct arbitrary AI writes.
- Worker health reports queue mode and registered handler count.

**Steps:**

1. Write integration tests that enqueue jobs and assert DB changes.
2. Add job payload schemas for every job.
3. Update runtime to validate payloads before processing.
4. Run:

```bash
CTW_DB_MODE=prisma CTW_JOBS_MODE=pgboss pnpm --filter @ctw/worker test
pnpm --filter @ctw/jobs test
pnpm typecheck
```

5. Commit:

```bash
git add apps/worker packages/jobs
git commit -m "feat: process durable workflow jobs"
```

---

## Milestone 3 Review

**Status:** Done after five reviewer passes.

Request one subagent review before continuing.

Review focus:

- provider live mode cannot run with fake credentials.
- inbound/outbound provider metadata is preserved.
- attachments are durably stored.
- worker job handlers mutate Prisma state safely and idempotently.

---

## Task 13: Full Deal Workspace CRUD Tabs

**Purpose:** Replace the overview-only deal workspace with real tab routes and forms.

**Status:** Done.

**Files:**

- Modify: `apps/web/src/router.tsx`
- Create: `apps/web/src/routes/deals.$dealId.messages.tsx`
- Create: `apps/web/src/routes/deals.$dealId.documents.tsx`
- Create: `apps/web/src/routes/deals.$dealId.tasks.tsx`
- Create: `apps/web/src/routes/deals.$dealId.participants.tsx`
- Create: `apps/web/src/routes/deals.$dealId.activity.tsx`
- Create: `apps/web/src/features/messages/messages-tab.tsx`
- Create: `apps/web/src/features/documents/documents-tab.tsx`
- Create: `apps/web/src/features/tasks/tasks-tab.tsx`
- Create: `apps/web/src/features/participants/participants-tab.tsx`
- Create: `apps/web/src/features/activity/activity-tab.tsx`
- Modify: `apps/web/src/lib/api/adapters/deals.ts`
- Test: `apps/web/src/features/**/*.test.tsx`

**Behavior:**

- Tabs are real routes with URL state.
- Messages support detail panel, visibility changes, hide/redact, reassign.
- Documents support upload, rename, classify/tag, visibility change, archive.
- Tasks support create, approve, edit, reject, defer, route, self-complete.
- Participants support add, update capabilities, remove, undo.
- Activity shows audit/approval/task/routing history with external redaction.

**Steps:**

1. Write component tests for each tab with mocked adapters.
2. Implement API adapters and hooks.
3. Build tabs as dumb components with props/callbacks.
4. Add to Playwright browser e2e.
5. Run:

```bash
pnpm --filter @ctw/web test
pnpm --filter @ctw/web e2e:browser
pnpm typecheck
```

6. Commit:

```bash
git add apps/web/src/routes apps/web/src/features apps/web/src/lib/api apps/web/e2e/browser
git commit -m "feat: add full deal workspace crud tabs"
```

---

## Task 14: Settings Users and Organization CRUD

**Purpose:** Make admin/AM settings usable instead of static panels.

**Status:** Done.

**Files:**

- Modify: `apps/web/src/router.tsx`
- Create: `apps/web/src/routes/settings.users.tsx`
- Modify: `apps/web/src/routes/settings.tsx`
- Create: `apps/web/src/features/settings/users-settings-screen.tsx`
- Create: `apps/web/src/features/settings/organization-settings-screen.tsx`
- Modify: `apps/web/src/lib/api/adapters/session.ts`
- Create: `apps/web/src/lib/api/adapters/settings.ts`
- Test: `apps/web/src/features/settings/settings.test.tsx`

**Behavior:**

- Admin can invite users, change role, disable/reactivate, resend invite.
- AM can manage deal-level broker/client participants but not org role defaults.
- Organization settings edits routing threshold, channel modes, org profile.
- Routing threshold preview shows count of current review/routed messages that would change.

**Steps:**

1. Write tests for role-gated controls and settings mutation feedback.
2. Implement settings adapters/hooks.
3. Implement forms and optimistic feedback.
4. Run:

```bash
pnpm --filter @ctw/web test settings
pnpm --filter @ctw/web typecheck
```

5. Commit:

```bash
git add apps/web/src/routes apps/web/src/features/settings apps/web/src/lib/api
git commit -m "feat: add real settings management"
```

---

## Task 15: Replace Local Kanban with shadcn-kanban-board

**Purpose:** Use the requested `janhesters/shadcn-kanban-board` component rather than local HTML drag/drop.

**Status:** Done.

**Files:**

- Create/modify: `apps/web/components.json`
- Create/modify: `apps/web/src/components/ui/kanban.tsx`
- Modify: `apps/web/src/routes/deals.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/e2e/browser/app-shell.spec.ts`
- Test: `apps/web/src/routes/deals.test.tsx`

**Behavior:**

- Board uses the shadcn kanban component as the drag/drop base.
- CTW-specific stage transitions and permissions remain in hooks/adapters.
- Invalid drop targets visibly reject with an inline reason.
- Successful stage move writes audit and shows feedback/undo.

**Steps:**

1. Initialize shadcn config if missing.
2. Install/adapt `https://shadcn-kanban-board.com/r/kanban.json`.
3. Keep component ownership in `components/ui/kanban.tsx`; do not scatter kanban internals through routes.
4. Run:

```bash
pnpm --filter @ctw/web typecheck
pnpm --filter @ctw/web e2e:browser
```

5. Commit:

```bash
git add apps/web/components.json apps/web/src/components/ui/kanban.tsx apps/web/src/routes/deals.tsx apps/web/src/styles.css apps/web/e2e/browser
git commit -m "feat: use shadcn kanban board"
```

---

## Milestone 4 Review

**Status:** Done after four reviewer passes.

Request one subagent review before continuing.

Review focus:

- CRUD surfaces match `docs/screens.md`.
- browser/client behavior works for AM, admin, broker, client, and VA.
- kanban uses the requested component base.
- components stay dumb and server data stays in adapters/hooks.

---

## Task 16: Postgres-Backed E2E Suite

**Status:** Done.

**Purpose:** Make e2e tests exercise the real app stack with seeded Postgres.

**Files:**

- Modify: `playwright.config.ts`
- Modify: `apps/web/e2e/browser/app-shell.spec.ts`
- Create: `apps/web/e2e/browser/auth-permissions.spec.ts`
- Create: `apps/web/e2e/browser/ingestion-routing.spec.ts`
- Create: `apps/web/e2e/browser/deal-workspace-crud.spec.ts`
- Create: `apps/web/e2e/browser/task-va-flow.spec.ts`
- Create: `packages/testkit/src/db.ts`
- Modify: `packages/testkit/src/index.ts`

**Flows:**

1. Admin seeds org and users.
2. AM logs in, creates deal, adds broker/client, sets capabilities.
3. Broker/client logs in and sees permission-limited deal portal.
4. Inbound email with attachment routes/files to deal or review queue.
5. AM resolves low-confidence routing review.
6. AM approves System draft outbound.
7. AM routes work to VA, VA submits, AM accepts.
8. Settings routing threshold update changes review behavior.

**Steps:**

1. Add testkit DB reset/seed helper.
2. Update Playwright webServer env to use Prisma/Postgres.
3. Write browser e2e tests for each flow.
4. Run:

```bash
docker compose up -d postgres minio
pnpm db:migrate
pnpm --filter @ctw/web e2e
```

5. Commit:

```bash
git add playwright.config.ts apps/web/e2e packages/testkit
git commit -m "test: run e2e against seeded postgres"
```

---

## Task 17: Production Deployment Hardening

**Status:** Done.

**Purpose:** Make Railway/docker deployment match the durable app.

**Files:**

- Modify: `Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `railway.json`
- Modify: `docs/deployment.md`
- Create: `docs/operations/runbook.md`
- Modify: `.env.example`

**Behavior:**

- Separate Railway services for API, worker, web static build, Postgres, object storage.
- Startup commands run migrations/seed only when explicitly requested.
- API health verifies database connection and provider config mode.
- Worker health verifies queue connection and registered handlers.
- Deployment docs list required env vars by service.

**Steps:**

1. Add API readiness endpoint if needed: `/readyz`.
2. Add worker readiness CLI command or health endpoint.
3. Document release, rollback, migration, seed, and provider webhook setup.
4. Run:

```bash
pnpm build
docker compose config
pnpm --filter @ctw/api start
pnpm --filter @ctw/worker start
```

5. Commit:

```bash
git add Dockerfile docker-compose.yml railway.json docs/deployment.md docs/operations .env.example apps/api apps/worker
git commit -m "chore: harden production deployment"
```

---

## Final Verification

Run all commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm openapi:generate
pnpm client:generate
docker compose up -d postgres minio
pnpm db:migrate
pnpm db:seed
CTW_RUNTIME_MODE=test CTW_DB_MODE=prisma pnpm --filter @ctw/api test
CTW_RUNTIME_MODE=test CTW_DB_MODE=prisma pnpm --filter @ctw/worker test
pnpm --filter @ctw/web e2e
pnpm build
docker compose config
git status --short
```

Expected:

- All checks pass.
- Generated OpenAPI/client have no uncommitted diff.
- E2E tests use seeded Postgres, not memory fixtures.
- `CTW_RUNTIME_MODE=production` refuses demo tokens, memory workflow, and fake providers.
- Worktree is clean.

## Explicit Non-Goals

- No trust dashboard/autonomy features.
- No AI agent writing directly to Prisma tables.
- No multi-tenant org switching beyond the data shape unless needed for auth tests.
- No external public API console.
- No notification center beyond existing backlog indicators.
- No hard-delete admin tools.
