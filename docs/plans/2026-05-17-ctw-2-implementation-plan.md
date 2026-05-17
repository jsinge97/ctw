# CTW 2.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the initial CTW 2.0 product: typed full-stack deal operations with auth, permissions, deal kanban/workspace, channel ingestion, one next action, VA queue, audit history, and approval flows.

**Architecture:** TypeScript monorepo with `apps/api`, `apps/web`, and `apps/worker`. Backend is Node/Fastify with Zod contracts, OpenAPI generation, Prisma/Postgres, Better Auth, pg-boss jobs, Resend email, Twilio SMS/voice, and S3-compatible storage. Frontend follows the AI frontend scaffolding model: TanStack Router/Query/Table, generated API client, adapters, domain hooks, and dumb components.

**Tech Stack:** pnpm, turbo, TypeScript, Fastify, Zod, OpenAPI, Prisma, PostgreSQL, pg-boss, Better Auth, Resend, Twilio, Vite, React, TanStack Router, TanStack Query, TanStack Table, Tailwind v4, shadcn/ui, Base UI, Vitest, Playwright.

---

## Source Docs

Before implementing anything, read these source-of-truth docs in full:

- `docs/feature-plan.md`
- `docs/crud-model.md`
- `docs/data-model.md`
- `docs/architecture.md`
- `docs/screens.md`
- `docs/design-reference-notes.md`

Treat these docs as binding. If implementation details in this plan conflict with the source docs, pause and update the plan or ask for clarification before coding.

Implementation must follow these product decisions:

- Deals are the top-level object.
- Message-to-deal routing is app-owned and fast.
- One next action per deal.
- Brokers/clients can log in, but channels remain primary.
- Permissions are capability-based.
- VA work is an internal tab in the same app.
- No autonomy/trust dashboard in the initial build.
- Every meaningful mutation writes audit history.

## Execution Rules

- Start by reading the source-of-truth docs listed above.
- At the start of each task, re-read the source docs that are directly relevant to that task.
- Work task-by-task in order unless there is a clear dependency reason to split or reorder.
- Run the validation commands listed in each task before committing that task.
- Commit after each completed task using the commit message shown in that task.
- Keep commits small and aligned to the task boundaries. Do not batch several tasks into one commit.
- If a task cannot be completed cleanly, do not skip its commit silently. Record the blocker, leave the worktree understandable, and update the plan before moving on.

## Milestones

1. [x] Repo foundation and typed package boundaries.
2. [x] Contracts, OpenAPI, generated client.
3. [x] Database schema, migrations, repositories.
4. [x] Auth, permissions, audit, approval foundation.
5. [x] Backend workflow API surface and worker ingestion foundation.
6. [ ] Frontend foundation and source-of-truth docs.
7. [ ] Deal kanban and workspace screens.
8. [ ] Channel ingestion and filing hardening.
9. [ ] Next action, task execution, outbound approval hardening.
10. [ ] Routing review, VA queue, settings hardening.
11. [ ] E2E hardening and deployment prep.

## Progress Log

- [x] Read source-of-truth docs before implementation.
- [x] Completed Task 1 and committed `chore: scaffold typed monorepo`.
- [x] Completed Task 2 and committed `chore: add config and observability foundation`.
- [x] Completed Task 3 and committed `feat: add contract and openapi foundation`.
- [x] Completed Task 4 and committed `feat: add initial database schema`.
- [x] Completed Task 5 and committed `feat: add domain rules`.
- [x] Completed Task 6 and committed `feat: add auth and permission foundation`.
- [x] Completed Task 7 and committed `feat: add audit approval and outcome services`.
- [x] Completed Phase 1 review fixes and reviewer pass cleared.
- [x] Completed initial backend workflow API surface and worker ingestion commits.
- [x] Completed Phase 2 review pass 1 fixes: route-level auth/capability gates, contract-backed body parsing, typed generated client path params, webhook queueing, task approval side effects, routing review resolution state, and VA work transitions.
- [ ] Phase 2 reviewer pass 2.
- [x] Completed Task 10 source-of-truth frontend docs.
- [x] Completed Task 11 web app foundation.
- [x] Completed Phase 2 review pass 2 fixes: deal-scoped activity auth, participant-aware deal visibility, VA execute capability, stricter routing resolution schema, real low-confidence message seed, routing status updates, outbound send status/provider tracking, and VA task state synchronization.

---

## Task 1: Monorepo Foundation

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/api/package.json`
- Create: `apps/web/package.json`
- Create: `apps/worker/package.json`
- Create: `packages/config/package.json`
- Create: `packages/contracts/package.json`
- Create: `packages/domain/package.json`
- Create: `packages/db/package.json`
- Create: `packages/auth/package.json`
- Create: `packages/permissions/package.json`
- Create: `packages/storage/package.json`
- Create: `packages/integrations/package.json`
- Create: `packages/jobs/package.json`
- Create: `packages/api-client/package.json`
- Create: `packages/observability/package.json`
- Create: `packages/testkit/package.json`

**Step 1: Create workspace manifests**

Set up pnpm workspaces for `apps/*` and `packages/*`.

**Step 2: Add strict TypeScript config**

`tsconfig.base.json` must enable:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "moduleResolution": "Bundler"
  }
}
```

**Step 3: Add root scripts**

Root scripts:

```txt
pnpm dev
pnpm typecheck
pnpm test
pnpm lint
pnpm prisma:generate
pnpm db:migrate
pnpm openapi:generate
pnpm client:generate
```

**Step 4: Run validation**

Run:

```bash
pnpm install
pnpm typecheck
```

Expected:

- Install succeeds.
- Typecheck finds no projects or passes with placeholder package configs.

**Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold typed monorepo"
```

---

## Task 2: Shared Config and Observability

**Files:**

- Create: `packages/config/src/env.ts`
- Create: `packages/config/src/index.ts`
- Create: `packages/observability/src/logger.ts`
- Create: `packages/observability/src/request-id.ts`
- Create: `packages/observability/src/index.ts`
- Test: `packages/config/src/env.test.ts`

**Step 1: Write env schema test**

Test that required env variables are validated:

- `DATABASE_URL`
- `APP_BASE_URL`
- `BETTER_AUTH_SECRET`
- `RESEND_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `STORAGE_ENDPOINT`
- `STORAGE_BUCKET`

**Step 2: Implement Zod env loader**

Only `packages/config` may read `process.env`.

**Step 3: Implement logger and request IDs**

Use a structured logger wrapper. Every API request and job should receive a request/job ID.

**Step 4: Run tests**

```bash
pnpm --filter @ctw/config test
pnpm typecheck
```

**Step 5: Commit**

```bash
git add packages/config packages/observability
git commit -m "chore: add config and observability foundation"
```

---

## Task 3: Contracts and OpenAPI Foundation

**Files:**

- Create: `packages/contracts/src/errors.ts`
- Create: `packages/contracts/src/openapi.ts`
- Create: `packages/contracts/src/common.ts`
- Create: `apps/api/src/openapi.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/health.routes.ts`
- Test: `packages/contracts/src/errors.test.ts`
- Test: `apps/api/src/openapi.test.ts`

**Step 1: Define common API error envelope**

Use:

```ts
type ApiError = {
  code: string
  message: string
  details?: unknown
  requestId: string
}
```

**Step 2: Define contract helpers**

Create a small contract helper that keeps method, path, request schema, response schema, and OpenAPI metadata together.

**Step 3: Add health route**

Add:

```txt
GET /healthz
GET /openapi.json
```

**Step 4: Generate OpenAPI**

Add `pnpm openapi:generate`.

This task creates only shared contract infrastructure. Feature contracts, including deals, are introduced in their owning vertical-slice tasks.

**Step 5: Run tests**

```bash
pnpm --filter @ctw/contracts test
pnpm --filter @ctw/api test
pnpm openapi:generate
pnpm typecheck
```

**Step 6: Commit**

```bash
git add packages/contracts apps/api
git commit -m "feat: add contract and openapi foundation"
```

---

## Task 4: Database Schema and Migrations

**Files:**

- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/prisma.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/migrate.ts`
- Create: `packages/db/src/generated/.gitkeep`
- Test: `packages/db/src/prisma-schema.test.ts`

**Step 1: Translate data model into Prisma schema**

Implement the initial tables from `docs/data-model.md`:

- organizations
- users
- organization_memberships
- contacts
- companies
- deals
- deal_participants
- permission_grants
- channels
- messages
- message_participants
- documents
- document_versions
- tasks
- routing_review_items
- va_work_items
- approval_events
- audit_events
- task_outcomes

**Step 2: Add important indexes and constraints**

Include:

- unique auth provider subject.
- unique membership per org/user.
- unique active current next action per deal.
- organization-scoped indexes for deals, messages, documents, tasks.

**Step 3: Generate Prisma client and migration**

Run:

```bash
pnpm --filter @ctw/db prisma:generate
pnpm --filter @ctw/db db:generate
pnpm --filter @ctw/db db:migrate
```

Expected:

- Prisma client generates successfully.
- Migration applies to local Postgres.

**Step 4: Test schema**

Test that core inserts work in a transaction:

- create org
- create user
- create membership
- create deal
- create participant

**Step 5: Commit**

```bash
git add packages/db
git commit -m "feat: add initial database schema"
```

---

## Task 5: Domain Types and Rules

**Files:**

- Create: `packages/domain/src/stages.ts`
- Create: `packages/domain/src/tasks.ts`
- Create: `packages/domain/src/audit.ts`
- Create: `packages/domain/src/visibility.ts`
- Create: `packages/domain/src/errors.ts`
- Create: `packages/domain/src/index.ts`
- Test: `packages/domain/src/stages.test.ts`
- Test: `packages/domain/src/tasks.test.ts`
- Test: `packages/domain/src/visibility.test.ts`

**Step 1: Add stage transition rules**

Implement:

- valid CRE stages.
- `canTransitionDealStage(from, to)`.
- terminal/lifecycle status helpers.

**Step 2: Add task state rules**

Implement:

- terminal task status helper.
- one-current-next-action eligibility.
- valid route values: System, VA, Self.

**Step 3: Add audit sanitizer**

Implement `sanitizeAuditPayload` so audit events never store full message or document bodies.

**Step 4: Run tests**

```bash
pnpm --filter @ctw/domain test
pnpm typecheck
```

**Step 5: Commit**

```bash
git add packages/domain
git commit -m "feat: add domain rules"
```

---

## Task 6: Auth and Permissions Foundation

**Files:**

- Create: `packages/auth/src/better-auth.ts`
- Create: `packages/auth/src/context.ts`
- Create: `packages/auth/src/index.ts`
- Create: `packages/contracts/src/session/session.schemas.ts`
- Create: `packages/contracts/src/session/session.contract.ts`
- Create: `packages/permissions/src/capabilities.ts`
- Create: `packages/permissions/src/role-defaults.ts`
- Create: `packages/permissions/src/evaluate.ts`
- Create: `packages/permissions/src/index.ts`
- Create: `apps/api/src/modules/session/session.routes.ts`
- Create: `apps/api/src/modules/session/session.service.ts`
- Test: `packages/permissions/src/evaluate.test.ts`
- Test: `apps/api/src/modules/session/session.integration.test.ts`
- Modify: `apps/api/src/server.ts`

**Step 1: Configure Better Auth**

Set up Better Auth with the app's database connection and session handling.

**Step 2: Define ActorContext**

Actor context includes:

- user
- organization
- membership
- role
- requestId

**Step 3: Define capabilities**

Use the capabilities from `docs/feature-plan.md`:

- viewDeal
- viewKanban
- viewMessages
- viewDocuments
- uploadDocuments
- editDealFields
- moveDealStage
- createTask
- editTask
- completeAssignedTask
- approveProposedAction
- approveOutboundSend
- routeWork
- viewRoutingReview
- viewVaQueue
- viewSettingsUsers
- viewSettingsOrganization
- viewActivity
- manageParticipants
- managePermissions
- manageOrganizationSettings

**Step 4: Implement permission precedence**

Precedence:

1. Explicit deny on narrowest scope.
2. Explicit allow on narrowest scope.
3. Deal participant grant.
4. Organization membership grant.
5. Role default.
6. Deny by default.

**Step 5: Add API auth middleware**

Every authenticated route gets ActorContext.

**Step 6: Add current session endpoints**

Add:

```txt
GET /v1/session/current
POST /v1/session/accept-invitation
```

`GET /v1/session/current` returns the current user, active organization, membership, role, capabilities, allowed top-level surfaces, and the role-based home route used by `/`.

`POST /v1/session/accept-invitation` supports the `/login` invitation flow and returns the same session payload after acceptance.

**Step 7: Run tests**

```bash
pnpm --filter @ctw/permissions test
pnpm --filter @ctw/auth test
pnpm --filter @ctw/api test session
pnpm openapi:generate
pnpm client:generate
pnpm typecheck
```

**Step 8: Commit**

```bash
git add packages/auth packages/permissions packages/contracts apps/api packages/api-client
git commit -m "feat: add auth and permission foundation"
```

---

## Task 7: Audit, Approval, and Outcome Services

**Files:**

- Create: `packages/db/src/repositories/audit.repository.ts`
- Create: `packages/db/src/repositories/approval-events.repository.ts`
- Create: `packages/db/src/repositories/task-outcomes.repository.ts`
- Create: `apps/api/src/modules/audit/audit.service.ts`
- Test: `apps/api/src/modules/audit/audit.service.test.ts`

**Step 1: Add repositories**

Repositories should support append-only writes and organization/deal-scoped reads.

**Step 2: Add audit service**

Service helpers:

- `recordAuditEvent`
- `recordApprovalEvent`
- `recordTaskOutcome`

**Step 3: Enforce sanitization**

Test that message/document bodies are not written to audit payloads.

**Step 4: Run tests**

```bash
pnpm --filter @ctw/api test audit
pnpm typecheck
```

**Step 5: Commit**

```bash
git add packages/db apps/api/src/modules/audit
git commit -m "feat: add audit approval and outcome services"
```

---

## Task 8: Deals API Vertical Slice

**Files:**

- Create: `packages/contracts/src/deals/deals.schemas.ts`
- Create: `packages/contracts/src/deals/deals.contract.ts`
- Create: `packages/db/src/repositories/deals.repository.ts`
- Create: `apps/api/src/modules/deals/deals.routes.ts`
- Create: `apps/api/src/modules/deals/deals.handlers.ts`
- Create: `apps/api/src/modules/deals/deals.mappers.ts`
- Create: `apps/api/src/modules/deals/deals.service.ts`
- Test: `apps/api/src/modules/deals/deals.integration.test.ts`

**Step 1: Define deal DTOs and requests**

Cover:

- list deals.
- create deal.
- get deal.
- patch deal fields.
- move stage.
- archive deal.

**Step 2: Implement repository**

Every query is organization-scoped and permission-aware at the service layer.

**Step 3: Implement service**

Every mutation:

- calls `assertCan`.
- writes audit event.
- returns contract DTO.

**Step 4: Implement routes**

Add:

```txt
GET /v1/deals
POST /v1/deals
GET /v1/deals/{dealId}
PATCH /v1/deals/{dealId}
POST /v1/deals/{dealId}/move-stage
POST /v1/deals/{dealId}/archive
```

**Step 5: Run tests and codegen**

```bash
pnpm --filter @ctw/api test deals
pnpm openapi:generate
pnpm client:generate
pnpm typecheck
```

**Step 6: Commit**

```bash
git add packages/contracts packages/db apps/api packages/api-client
git commit -m "feat: add deals api vertical slice"
```

---

## Task 9: Participants and Permissions API

**Files:**

- Create: `packages/contracts/src/participants/participants.schemas.ts`
- Create: `packages/contracts/src/participants/participants.contract.ts`
- Create: `packages/db/src/repositories/participants.repository.ts`
- Create: `packages/db/src/repositories/permissions.repository.ts`
- Create: `apps/api/src/modules/participants/participants.routes.ts`
- Create: `apps/api/src/modules/participants/participants.service.ts`
- Test: `apps/api/src/modules/participants/participants.integration.test.ts`

**Step 1: Define participant contracts**

Cover:

- add participant.
- update role/visibility/capabilities.
- remove participant.
- list participants for a deal.

**Step 2: Implement service**

Rules:

- one subject per participant row.
- capability preview data returned for before/after UI.
- participant removal writes audit event.

**Step 3: Run tests**

```bash
pnpm --filter @ctw/api test participants
pnpm openapi:generate
pnpm client:generate
pnpm typecheck
```

**Step 4: Commit**

```bash
git add packages/contracts packages/db apps/api packages/api-client
git commit -m "feat: add deal participants and permissions api"
```

---

## Task 10: Frontend Source-of-Truth Docs

**Files:**

- Create: `docs/design-philosophy.md`
- Create: `docs/design-system.md`
- Create: `docs/frontend-architecture.md`
- Create: `CLAUDE.md`

**Step 1: Write design philosophy**

Use `docs/screens.md` hierarchy principles and `docs/design-reference-notes.md`. The app should feel dense, operational, calm, and permission-aware.

**Step 2: Write design system**

Define:

- fonts.
- colors.
- spacing.
- radius.
- status colors.
- visibility chips.
- stage colors.
- task route badges.
- hit targets.
- confirmation/undo patterns.
- kanban styling tokens and CTW adaptations for `janhesters/shadcn-kanban-board`.
- reference-inspired shell, list/detail, badge, and review-panel patterns that should be preserved without copying the zip implementation.

**Step 3: Write frontend architecture**

Document the four layers from `ai-frontend-scaffolding`:

- Router.
- Adapters.
- Domain hooks.
- Components.

**Step 4: Write CLAUDE.md**

Must include:

- source-of-truth doc list.
- no data fetching in components.
- URL params as state source of truth.
- generated API client wrapped by adapters.
- domain hooks own TanStack Query.
- components receive normalized props only.

**Step 5: Commit**

```bash
git add docs/design-philosophy.md docs/design-system.md docs/frontend-architecture.md CLAUDE.md
git commit -m "docs: add frontend source of truth"
```

---

## Task 11: Web App Foundation

**Files:**

- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/router.tsx`
- Create: `apps/web/src/routes/__root.tsx`
- Create: `apps/web/src/routes/index.tsx`
- Create: `apps/web/src/routes/login.tsx`
- Create: `apps/web/src/lib/query-client.ts`
- Create: `apps/web/src/lib/api/runtime.ts`
- Create: `apps/web/src/lib/api/adapters/session.ts`
- Create: `apps/web/src/lib/api/adapters/deals.ts`
- Create: `apps/web/src/hooks/use-current-session.ts`
- Create: `apps/web/src/hooks/use-deals.ts`
- Create: `apps/web/src/components/app-shell.tsx`
- Create: `apps/web/src/components/ui/*`
- Test: `apps/web/src/router.test.tsx`

**Step 1: Scaffold Vite React app**

Use Vite + React + TanStack Router + TanStack Query + Tailwind v4.

**Step 2: Initialize shadcn/Base UI**

Add initial primitives:

- Button.
- Input.
- Table.
- Tabs.
- Badge.
- Dialog.
- Popover.
- Select.
- Skeleton.
- Toast/Sonner.

**Step 3: Wire generated API client**

Create frontend adapters wrapping `packages/api-client`.

**Step 4: Add root route and app shell**

Shell surfaces:

- Deals.
- Routing review.
- VA queue.
- Settings.

Visibility is based on normalized capability props.

The app shell must also include:

- role-based `/` redirect using `/v1/session/current`.
- `/login` invitation acceptance path.
- global search entry point.
- organization switcher for multi-org users.
- scoped notification indicator for routing review backlog and pending approvals.

**Step 5: Run tests**

```bash
pnpm --filter @ctw/web test
pnpm --filter @ctw/web typecheck
```

**Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: scaffold web app foundation"
```

---

## Task 12: Deals Kanban Screen

**Files:**

- Create: `apps/web/src/routes/deals.tsx`
- Create: `apps/web/src/features/deals/deals-kanban-screen.tsx`
- Create: `apps/web/src/features/deals/deal-card.tsx`
- Create: `apps/web/src/features/deals/deals-search-schema.ts`
- Create: `apps/web/src/features/deals/use-deals-kanban.ts`
- Add/adapt: `apps/web/src/components/ui/kanban.tsx`
- Add/adapt: `apps/web/src/hooks/use-js-loaded.ts`
- Test: `apps/web/src/features/deals/deals-kanban-screen.test.tsx`

**Step 1: Define route search params**

Search params:

- owner.
- stage.
- participantCompany.
- hasStaleFlag.
- hasPendingApproval.
- search.

**Step 2: Install/adapt the kanban board**

Use `janhesters/shadcn-kanban-board` as the base implementation:

```bash
pnpm dlx shadcn@latest add https://shadcn-kanban-board.com/r/kanban.json
pnpm dlx shadcn@latest add https://shadcn-kanban-board.com/r/use-js-loaded.json
```

Adapt paths and styling to this repo's shadcn setup. Preserve its keyboard drag/drop and screen-reader affordances unless a CTW-specific permission behavior requires a targeted change.

**Step 3: Build screen with mock data first**

Follow `docs/screens.md`:

- columns by stage.
- deal card information hierarchy.
- one next action label.
- capability-aware drag handle.

**Step 4: Connect domain hook**

Use `useDealsKanban`.

**Step 5: Implement feedback**

Stage move:

- optimistic move.
- audit-backed mutation.
- undo toast.
- invalid transition inline reason.

**Step 6: Run tests**

```bash
pnpm --filter @ctw/web test deals-kanban
pnpm --filter @ctw/web typecheck
```

**Step 7: Commit**

```bash
git add apps/web/src/routes/deals.tsx apps/web/src/features/deals
git commit -m "feat: add deals kanban screen"
```

---

## Task 13: Deal Workspace Shell

**Files:**

- Create: `apps/web/src/routes/deals.$dealId.tsx`
- Create: `apps/web/src/routes/deals.$dealId.index.tsx`
- Create: `apps/web/src/features/deal-workspace/deal-workspace-shell.tsx`
- Create: `apps/web/src/features/deal-workspace/deal-header.tsx`
- Create: `apps/web/src/features/deal-workspace/next-action-panel.tsx`
- Create: `apps/web/src/features/deal-workspace/use-deal-workspace.ts`
- Test: `apps/web/src/features/deal-workspace/deal-workspace-shell.test.tsx`

**Step 1: Define deal shell**

Persistent header plus tabs:

- Overview.
- Messages.
- Documents.
- Tasks.
- Participants.
- Activity.

**Step 2: Implement next action panel**

Controls:

- primary Approve.
- secondary Edit, Defer.
- overflow Reject/Reroute.

Until Task 17 lands the real task APIs, wire controls to mock callbacks or disabled API-pending states that make the limitation explicit in tests.

**Step 3: Add Overview tab shell**

Include the information areas from `docs/screens.md`, backed by available deal data first and placeholders only where later APIs are required:

- recent activity.
- deal facts.
- stage history.
- participant summary.
- pending approvals.

**Step 4: Add permission-aware rendering**

Broker/client see read-only summary if shared.

**Step 5: Run tests**

```bash
pnpm --filter @ctw/web test deal-workspace
pnpm --filter @ctw/web typecheck
```

**Step 6: Commit**

```bash
git add apps/web/src/routes apps/web/src/features/deal-workspace
git commit -m "feat: add deal workspace shell"
```

---

## Task 14: Messages and Documents APIs

**Files:**

- Create: `packages/contracts/src/messages/messages.schemas.ts`
- Create: `packages/contracts/src/documents/documents.schemas.ts`
- Create: `packages/db/src/repositories/messages.repository.ts`
- Create: `packages/db/src/repositories/documents.repository.ts`
- Create: `apps/api/src/modules/messages/messages.routes.ts`
- Create: `apps/api/src/modules/messages/messages.service.ts`
- Create: `apps/api/src/modules/documents/documents.routes.ts`
- Create: `apps/api/src/modules/documents/documents.service.ts`
- Test: `apps/api/src/modules/messages/messages.integration.test.ts`
- Test: `apps/api/src/modules/documents/documents.integration.test.ts`

**Step 1: Implement list/detail/update visibility contracts**

Messages:

- list by deal.
- detail.
- reassign to deal.
- mark internal/shared.
- hide/redact.

Documents:

- list by deal.
- detail.
- upload metadata.
- rename/classify/tag/folder/visibility.
- archive.

**Step 2: Enforce visibility**

External users see only allowed messages/documents.

**Step 3: Run tests and codegen**

```bash
pnpm --filter @ctw/api test messages documents
pnpm openapi:generate
pnpm client:generate
pnpm typecheck
```

**Step 4: Commit**

```bash
git add packages/contracts packages/db apps/api packages/api-client
git commit -m "feat: add messages and documents api"
```

---

## Task 15: Messages and Documents Screens

**Files:**

- Create: `apps/web/src/routes/deals.$dealId.messages.tsx`
- Create: `apps/web/src/routes/deals.$dealId.documents.tsx`
- Create: `apps/web/src/features/messages/messages-tab.tsx`
- Create: `apps/web/src/features/messages/message-detail-panel.tsx`
- Create: `apps/web/src/features/documents/documents-tab.tsx`
- Create: `apps/web/src/features/documents/document-detail-panel.tsx`
- Create: `apps/web/src/features/messages/use-deal-messages.ts`
- Create: `apps/web/src/features/documents/use-deal-documents.ts`
- Test: `apps/web/src/features/messages/messages-tab.test.tsx`
- Test: `apps/web/src/features/documents/documents-tab.test.tsx`

**Step 1: Build Messages tab**

Follow `docs/screens.md`:

- timeline.
- visibility chips.
- detail panel in URL search params.
- internal-only treatment.
- reassign confirm + undo.

**Step 2: Build Documents tab**

Follow `docs/screens.md`:

- grouped by document type.
- classification progress state.
- detail panel in URL search params.
- upload vs replace separated.
- visibility preview before commit.

**Step 3: Run tests**

```bash
pnpm --filter @ctw/web test messages documents
pnpm --filter @ctw/web typecheck
```

**Step 4: Commit**

```bash
git add apps/web/src/routes apps/web/src/features/messages apps/web/src/features/documents
git commit -m "feat: add messages and documents tabs"
```

---

## Task 16: Ingestion, Storage, and Async Filing

**Files:**

- Create: `packages/integrations/src/resend.ts`
- Create: `packages/integrations/src/twilio.ts`
- Create: `packages/integrations/src/outbound-email.ts`
- Create: `packages/integrations/src/outbound-sms.ts`
- Create: `packages/storage/src/storage.ts`
- Create: `packages/jobs/src/jobs.ts`
- Create: `apps/api/src/modules/webhooks/resend.routes.ts`
- Create: `apps/api/src/modules/webhooks/twilio.routes.ts`
- Create: `apps/worker/src/jobs/ingest-email.ts`
- Create: `apps/worker/src/jobs/ingest-twilio.ts`
- Create: `apps/worker/src/jobs/classify-document.ts`
- Create: `apps/worker/src/jobs/extract-document-text.ts`
- Create: `apps/worker/src/jobs/propose-next-action.ts`
- Create: `apps/worker/src/jobs/generate-system-draft.ts`
- Test: `apps/api/src/modules/webhooks/webhooks.integration.test.ts`
- Test: `apps/worker/src/jobs/ingest-email.test.ts`
- Test: `apps/worker/src/jobs/generate-system-draft.test.ts`

**Step 1: Normalize provider payloads**

Resend and Twilio adapters return normalized ingestion commands.

**Step 2: Implement webhook routes**

Routes:

```txt
POST /v1/webhooks/resend
POST /v1/webhooks/twilio
```

They validate signatures, store raw payloads, enqueue jobs, and return quickly.

**Step 3: Implement message-to-deal fast path**

Use:

- sender/contact match.
- thread key.
- active deal participants.
- configurable routing confidence threshold.

**Step 4: Implement review item creation**

If below threshold, create `routing_review_item`.

**Step 5: Implement async document classification**

File first, classify after filing.

**Step 6: Add outbound provider adapters**

Create typed outbound adapters for:

- Resend outbound email.
- Twilio outbound SMS.

These adapters should be callable by task approval services later and fakeable in tests.

**Step 7: Stub next-action and System draft jobs**

Add typed job payload/result schemas for:

- next-action proposal generation.
- System draft generation.

The first implementation can be deterministic/template-backed. It should still write proposed task/draft records through app services so later AI logic can replace the internals without changing the workflow contract.

**Step 8: Run tests**

```bash
pnpm --filter @ctw/api test webhooks
pnpm --filter @ctw/worker test ingest
pnpm --filter @ctw/worker test generate-system-draft
pnpm typecheck
```

**Step 9: Commit**

```bash
git add packages/integrations packages/storage packages/jobs apps/api apps/worker
git commit -m "feat: add channel ingestion and async filing"
```

---

## Task 17: Tasks, Next Action, and Work Execution APIs

**Files:**

- Create: `packages/contracts/src/tasks/tasks.schemas.ts`
- Create: `packages/contracts/src/va-work/va-work.schemas.ts`
- Create: `packages/db/src/repositories/tasks.repository.ts`
- Create: `packages/db/src/repositories/va-work.repository.ts`
- Create: `apps/api/src/modules/tasks/tasks.routes.ts`
- Create: `apps/api/src/modules/tasks/tasks.service.ts`
- Create: `apps/api/src/modules/va-work/va-work.routes.ts`
- Create: `apps/api/src/modules/va-work/va-work.service.ts`
- Test: `apps/api/src/modules/tasks/tasks.integration.test.ts`
- Test: `apps/api/src/modules/va-work/va-work.integration.test.ts`

**Step 1: Implement task contracts**

Cover:

- list deal tasks.
- create manual task.
- create proposed next action.
- approve/edit/reject/defer/reroute.
- approve outbound send.

Approving an outbound send must:

- create an approval event.
- call the outbound provider adapter.
- mark the draft message sent or failed.
- create/store the sent message in the Messages timeline.
- update the task status/outcome.
- write audit history.

**Step 2: Enforce one current next action**

Service must clear previous current next action when a new one is set.

**Step 3: Implement VA work**

Cover:

- route task to VA.
- list VA work.
- claim.
- mark in progress.
- ask clarification.
- submit.
- accept.
- send back.
- cancel.

**Step 4: Run tests and codegen**

```bash
pnpm --filter @ctw/api test tasks va-work
pnpm openapi:generate
pnpm client:generate
pnpm typecheck
```

**Step 5: Commit**

```bash
git add packages/contracts packages/db apps/api packages/api-client
git commit -m "feat: add tasks next action and va work api"
```

---

## Task 18: Tasks Tab and VA Queue

**Files:**

- Create: `apps/web/src/routes/deals.$dealId.tasks.tsx`
- Create: `apps/web/src/routes/va.tsx`
- Create: `apps/web/src/features/tasks/tasks-tab.tsx`
- Create: `apps/web/src/features/tasks/task-detail-panel.tsx`
- Create: `apps/web/src/features/tasks/send-confirmation-modal.tsx`
- Create: `apps/web/src/features/va/va-queue-screen.tsx`
- Create: `apps/web/src/features/va/va-work-detail-panel.tsx`
- Create: `apps/web/src/features/tasks/use-deal-tasks.ts`
- Create: `apps/web/src/features/va/use-va-work-items.ts`
- Test: `apps/web/src/features/tasks/tasks-tab.test.tsx`
- Test: `apps/web/src/features/va/va-queue-screen.test.tsx`

**Step 1: Build Tasks tab**

Must include:

- pinned current next action.
- grouped task list.
- detail panel in URL search params.
- outbound send confirmation modal with full draft, recipients, channel, and deal.

**Step 2: Build VA queue**

Must include:

- grouped statuses.
- filters.
- detail panel.
- VA actions.
- AM/Admin review actions.

**Step 3: Run tests**

```bash
pnpm --filter @ctw/web test tasks va
pnpm --filter @ctw/web typecheck
```

**Step 4: Commit**

```bash
git add apps/web/src/routes apps/web/src/features/tasks apps/web/src/features/va
git commit -m "feat: add tasks tab and va queue"
```

---

## Task 19: Routing Review Screen

**Files:**

- Create: `packages/contracts/src/routing-review/routing-review.schemas.ts`
- Create: `apps/api/src/modules/routing-review/routing-review.routes.ts`
- Create: `apps/api/src/modules/routing-review/routing-review.service.ts`
- Create: `apps/web/src/routes/routing-review.tsx`
- Create: `apps/web/src/features/routing-review/routing-review-screen.tsx`
- Create: `apps/web/src/features/routing-review/routing-review-detail-panel.tsx`
- Create: `apps/web/src/features/routing-review/use-routing-review.ts`
- Test: `apps/api/src/modules/routing-review/routing-review.integration.test.ts`
- Test: `apps/web/src/features/routing-review/routing-review-screen.test.tsx`

**Step 1: Add routing review API**

Cover:

- list open items.
- resolve to suggested deal.
- search and assign to any deal.
- mark unrelated.
- create new deal from message.

**Step 2: Build screen**

Follow `docs/screens.md`:

- oldest-first queue.
- confidence explanation.
- detail panel.
- undo for reversible resolutions.
- no broker/client/VA visibility.

**Step 3: Run tests**

```bash
pnpm --filter @ctw/api test routing-review
pnpm --filter @ctw/web test routing-review
pnpm typecheck
```

**Step 4: Commit**

```bash
git add packages/contracts apps/api apps/web
git commit -m "feat: add routing review workflow"
```

---

## Task 20: Activity and Settings APIs

**Files:**

- Create: `packages/contracts/src/activity/activity.schemas.ts`
- Create: `packages/contracts/src/settings/settings.schemas.ts`
- Create: `packages/contracts/src/users/users.schemas.ts`
- Create: `apps/api/src/modules/activity/activity.routes.ts`
- Create: `apps/api/src/modules/activity/activity.service.ts`
- Create: `apps/api/src/modules/settings/settings.routes.ts`
- Create: `apps/api/src/modules/settings/settings.service.ts`
- Create: `apps/api/src/modules/users/users.routes.ts`
- Create: `apps/api/src/modules/users/users.service.ts`
- Test: `apps/api/src/modules/activity/activity.integration.test.ts`
- Test: `apps/api/src/modules/settings/settings.integration.test.ts`
- Test: `apps/api/src/modules/users/users.integration.test.ts`

**Step 1: Add activity API**

Cover:

- list audit/approval events for a deal.
- filter by actor, event type, date range.
- return external-safe activity only for external users.

**Step 2: Add users/settings APIs**

Cover:

- invite user.
- change role.
- disable/reactivate user.
- resend invitation.
- read/update organization profile.
- read/update routing confidence threshold.
- read/update channel config.
- read/update role defaults.

**Step 3: Enforce high-stakes confirmation support**

APIs for role default changes, user disable, and routing threshold updates should return enough preview data for the frontend confirmation screens.

**Step 4: Run tests and codegen**

```bash
pnpm --filter @ctw/api test activity settings users
pnpm openapi:generate
pnpm client:generate
pnpm typecheck
```

**Step 5: Commit**

```bash
git add packages/contracts apps/api packages/api-client
git commit -m "feat: add activity users and settings api"
```

---

## Task 21: Participants, Activity, and Settings Screens

**Files:**

- Create: `apps/web/src/routes/deals.$dealId.participants.tsx`
- Create: `apps/web/src/routes/deals.$dealId.activity.tsx`
- Create: `apps/web/src/routes/settings.users.tsx`
- Create: `apps/web/src/routes/settings.organization.tsx`
- Create: `apps/web/src/features/participants/participants-tab.tsx`
- Create: `apps/web/src/features/activity/activity-tab.tsx`
- Create: `apps/web/src/features/settings/users-settings-screen.tsx`
- Create: `apps/web/src/features/settings/organization-settings-screen.tsx`
- Test: `apps/web/src/features/participants/participants-tab.test.tsx`
- Test: `apps/web/src/features/activity/activity-tab.test.tsx`
- Test: `apps/web/src/features/settings/settings.test.tsx`

**Step 1: Build Participants tab**

Include capability preview before save and remove-participant undo.

**Step 2: Build Activity tab**

Read-only combined audit and approval events.

**Step 3: Build Settings users**

Invite, role change, disable/reactivate, resend invite.

**Step 4: Build Settings organization**

Org profile, routing threshold, channel configuration, role defaults.

**Step 5: Run tests**

```bash
pnpm --filter @ctw/web test participants activity settings
pnpm --filter @ctw/web typecheck
```

**Step 6: Commit**

```bash
git add apps/web/src/routes apps/web/src/features/participants apps/web/src/features/activity apps/web/src/features/settings
git commit -m "feat: add participants activity and settings screens"
```

---

## Task 22: End-to-End Flows

**Files:**

- Create: `apps/web/e2e/auth-and-permissions.spec.ts`
- Create: `apps/web/e2e/deal-kanban.spec.ts`
- Create: `apps/web/e2e/ingestion-routing.spec.ts`
- Create: `apps/web/e2e/task-execution.spec.ts`
- Create: `apps/web/e2e/va-work.spec.ts`
- Create: `packages/testkit/src/factories.ts`
- Create: `packages/testkit/src/fake-providers.ts`

**Step 1: Add Playwright setup**

Seed test org, users, memberships, permissions, deals.

**Step 2: Add core flows**

Cover:

1. AM creates deal, adds broker/client, sets permissions.
2. Broker/client logs in and sees permission-limited kanban/status.
3. Inbound email routes to deal and files attachment.
4. Low-confidence message enters routing review and is resolved.
5. AM approves System draft outbound message.
6. AM routes task to VA, VA submits work, AM approves.

**Step 3: Run e2e**

```bash
pnpm --filter @ctw/web e2e
```

**Step 4: Commit**

```bash
git add apps/web/e2e packages/testkit
git commit -m "test: add initial e2e flows"
```

---

## Task 23: Deployment Prep

**Files:**

- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `railway.json`
- Create: `apps/api/src/health.routes.ts`
- Create: `apps/worker/src/health.ts`
- Create: `docs/deployment.md`

**Step 1: Add local compose**

Services:

- Postgres.
- S3-compatible storage emulator.
- API.
- Worker.
- Web.

**Step 2: Add production process commands**

Commands:

```txt
api: pnpm --filter @ctw/api start
worker: pnpm --filter @ctw/worker start
web: pnpm --filter @ctw/web build
```

**Step 3: Document Railway deployment**

Document:

- API service.
- Worker service.
- Postgres.
- object storage.
- environment variables.
- Resend webhook URL.
- Twilio webhook URL.
- migration command.

**Step 4: Run smoke tests**

```bash
pnpm typecheck
pnpm test
pnpm --filter @ctw/web build
```

**Step 5: Commit**

```bash
git add Dockerfile docker-compose.yml railway.json docs/deployment.md apps/api apps/worker
git commit -m "chore: add deployment prep"
```

---

## Final Verification

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @ctw/web e2e
pnpm openapi:generate
pnpm client:generate
git status --short
```

Expected:

- All checks pass.
- OpenAPI and generated client are committed.
- No unexpected untracked files.

## Implementation Notes

- Do not build cut screens: trust dashboard, advanced priority controls, Document Studio, notification center, external API console.
- Do not add autonomy tables or flows.
- Do not let AI write directly to persistence. AI creates typed proposed records or drafts.
- Do not expose database rows through API responses.
- Do not fetch server data in React components.
- Do not use disabled controls as the primary permission pattern. Hide unauthorized actions unless the disabled state teaches an important constraint.
