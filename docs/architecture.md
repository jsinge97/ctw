# CTW 2.0 Architecture Plan

Working draft, May 17, 2026.

This document defines the initial full-stack architecture for CTW 2.0. It is shaped by the feature plan, CRUD model, and data model:

- [feature-plan.md](feature-plan.md)
- [crud-model.md](crud-model.md)
- [data-model.md](data-model.md)

## Architecture Goals

1. Keep the deal workflow easy to extend.
2. Make the API contract explicit and generated.
3. Keep TypeScript types strong from database to API to frontend.
4. Keep domain rules out of React components and HTTP handlers.
5. Make permissions impossible to skip accidentally.
6. Keep AI-assisted work behind typed app-owned workflows.
7. Avoid framework magic that makes future features hard to reason about.

## Primary Stack Decisions

### Repository

Use a TypeScript monorepo.

Recommended tooling:

- `pnpm` workspaces.
- `turbo` for task orchestration.
- strict TypeScript project references.
- shared ESLint, Prettier, and TS configs.

### Backend

Use a TypeScript Node API with an OpenAPI contract.

Recommended stack:

- Node.js.
- Fastify for the HTTP server.
- Better Auth for authentication.
- Zod for request, response, env, job, and provider payload validation.
- OpenAPI 3.1 generated from route contracts.
- Prisma ORM for PostgreSQL schema, migrations, generated database client, and typed persistence access.
- PostgreSQL as the primary database.
- `pg-boss` as the initial PostgreSQL-backed job queue.
- S3-compatible object storage behind a storage abstraction.
- Resend for inbound and outbound email.
- Twilio for SMS and voice transcript ingestion.
- Background workers in TypeScript for ingestion, OCR/PDF extraction, async document classification, and AI-assisted tasks.

Why this shape:

- Fastify is explicit, plugin-friendly, and avoids decorator-heavy application structure.
- Zod gives one schema language for runtime validation and TypeScript inference.
- OpenAPI keeps the backend contract usable by the frontend, tests, and future external tooling.
- Prisma gives a developer-friendly schema and migration workflow while preserving typed database access in TypeScript.
- `pg-boss` keeps the initial async stack simple by avoiding a second queue datastore.
- Better Auth keeps authentication inside the TypeScript app instead of outsourcing core user/session behavior.
- Resend gives a developer-friendly email API and supports inbound email via webhooks.
- Twilio is the safest default for SMS/voice because it is battle-tested and can support both inbound/outbound SMS and later voice workflows.

### Frontend

Use the `ai-frontend-scaffolding` stack:

- Vite.
- React.
- TanStack Router.
- TanStack Query.
- TanStack Table.
- Tailwind v4.
- shadcn/ui with Base UI primitives.
- Orval or equivalent OpenAPI codegen for the typed API client.
- Zod for URL search params and local form validation.

Kanban implementation:

- Use `janhesters/shadcn-kanban-board` as the starting point for the deal kanban.
- Install/adapt its shadcn registry components after shadcn is initialized.
- Keep CTW-specific deal data, permissions, stage transition rules, and API mutations in CTW adapters/domain hooks.
- Do not hand-roll drag/drop behavior unless the imported board cannot support a required permission or accessibility behavior.

Frontend rule:

Components are dumb. They receive normalized props and callbacks. They do not fetch data, parse API responses, manage query keys, or run `useEffect` for server data.

## Monorepo Layout

Initial layout:

```txt
apps/
  api/
  web/
  worker/

packages/
  contracts/
  domain/
  db/
  api-client/
  auth/
  permissions/
  storage/
  integrations/
  jobs/
  config/
  observability/
  testkit/

docs/
```

### `apps/api`

Owns:

- Fastify server setup.
- Route registration.
- Auth/session middleware.
- Request context creation.
- OpenAPI document serving.
- HTTP error mapping.

Does not own:

- Business rules.
- Database schema.
- Provider-specific ingestion details.
- Frontend-facing component concerns.

### `apps/web`

Owns:

- React app.
- Routes.
- Screens.
- Domain hooks.
- OpenAPI-generated client adapters.
- UI composition.

Does not own:

- API response parsing beyond typed adapters.
- Permission logic beyond rendering allowed actions from API-provided capabilities.
- Business rules that decide whether a mutation is allowed.

### `apps/worker`

Owns:

- Background job runtime.
- Job registration.
- Retry configuration.
- Worker health checks.

Initial jobs:

- inbound email ingest.
- inbound SMS ingest.
- voice transcript ingest.
- OCR/PDF extraction.
- async document classification.
- next-action proposal generation.
- System draft generation.

Initial runtime:

- `pg-boss` using the primary PostgreSQL database.
- This stays behind `packages/jobs` so a later SQS or dedicated queue migration does not rewrite domain logic.

### `packages/contracts`

Owns:

- OpenAPI-facing DTO schemas.
- Request schemas.
- Response schemas.
- Error schemas.
- Route contract definitions.

Rules:

- API routes import contracts from here.
- Generated OpenAPI comes from here plus route metadata.
- Frontend does not import backend domain or database types. It consumes generated client types.

### `packages/domain`

Owns pure business rules:

- deal stage transitions.
- task status transitions.
- task routing rules.
- next-action state rules.
- audit event construction.
- outcome rules.
- core enum definitions.

Rules:

- No HTTP imports.
- No database client imports.
- No provider SDK imports.
- Functions take typed inputs and return typed outputs or typed domain errors.

### `packages/db`

Owns:

- Prisma schema.
- migrations.
- database connection.
- repositories.
- transaction helpers.
- generated Prisma client wrapper.

Rules:

- Repository functions accept explicit transaction/context.
- Repositories return database records or repository DTOs, not HTTP response shapes.
- No Fastify route handlers here.

### `packages/auth`

Owns:

- Better Auth server setup.
- identity provider integration.
- session verification.
- current user lookup.
- membership resolution.

Output:

- `ActorContext`, containing user, organization, membership, role, and request metadata.

### `packages/permissions`

Owns:

- capability definitions.
- role defaults.
- permission evaluation.
- visibility checks.

Core API:

```ts
can(actor, capability, scope): Promise<PermissionResult>
assertCan(actor, capability, scope): Promise<void>
```

Rules:

- Every mutation path calls `assertCan`.
- Read queries apply permission and visibility filters before returning data.
- Frontend permissions are hints only; backend permissions are authoritative.

### `packages/storage`

Owns:

- document storage abstraction.
- raw message payload storage.
- signed upload/download URLs.
- file checksum helpers.

Does not own:

- document classification.
- deal filing decisions.

### `packages/integrations`

Owns provider adapters:

- Resend inbound email parsing.
- Resend outbound email sending.
- Twilio SMS webhook parsing.
- Twilio voice transcript webhook parsing.
- Twilio outbound SMS calls.

Rules:

- Provider payloads are validated at the edge.
- Provider adapters return normalized ingestion commands.

### `packages/jobs`

Owns:

- job payload schemas.
- job names.
- enqueue helpers.
- retry policy constants.

Rules:

- Job payloads are Zod-validated before enqueue and before execution.
- Jobs call domain services, not route handlers.

### `packages/api-client`

Owns:

- generated OpenAPI TypeScript client.
- generated models.

Rules:

- Generated code is not manually edited.
- Frontend adapters wrap generated operations before domain hooks use them.

### `packages/config`

Owns:

- environment variable schema.
- configuration loader.
- per-environment defaults.

Rules:

- No package reads `process.env` directly except config.

### `packages/observability`

Owns:

- logger setup.
- request IDs.
- metrics helpers.
- tracing helpers.

### `packages/testkit`

Owns:

- test factories.
- fake providers.
- database setup helpers.
- permission test helpers.

## Backend Architecture

Use a feature-slice pattern across the monorepo. Each feature has contracts, domain rules, persistence, API services, and frontend adapters in predictable places. Repositories live in `packages/db`; API modules orchestrate them.

Example:

```txt
packages/contracts/src/deals/
  deals.schemas.ts
  deals.contract.ts

packages/domain/src/deals/
  deals.rules.ts
  deals.types.ts

packages/db/src/repositories/
  deals.repository.ts

apps/api/src/modules/deals/
  deals.routes.ts
  deals.handlers.ts
  deals.mappers.ts
  deals.service.ts
  deals.test.ts
```

### Request Flow

```txt
HTTP request
  -> Fastify route
  -> contract validation
  -> auth context
  -> handler
  -> service command/query
  -> permission assertion
  -> domain rule
  -> repository transaction
  -> audit/approval/outcome event
  -> contract response mapper
```

### Route Handlers

Handlers should be thin.

Handlers own:

- extracting validated params/body/query.
- creating command inputs.
- calling services.
- mapping typed service result to typed response.

Handlers do not own:

- permission decisions.
- transaction choreography unless trivial.
- business rules.
- provider-specific parsing.

### Services

Services are the main application layer.

Services own:

- command/query orchestration.
- permission assertions.
- transaction boundaries.
- calling repositories.
- creating audit events.
- enqueueing jobs after commit.

Example service names:

- `createDeal`
- `updateDealStage`
- `addDealParticipant`
- `routeInboundMessage`
- `resolveRoutingReviewItem`
- `createNextAction`
- `approveOutboundMessage`
- `routeTaskToVa`

### Repositories

Repositories own persistence.

Rules:

- No permission logic in repositories.
- No HTTP or OpenAPI types in repositories.
- Every repository query is organization-scoped unless explicitly global.
- Use transactions for multi-table mutations.

### Domain Rules

Domain rules should be pure functions where possible.

Examples:

- `canTransitionDealStage(from, to)`
- `isTerminalTaskStatus(status)`
- `canMarkCurrentNextAction(task)`
- `buildTaskOutcome(previous, next)`
- `sanitizeAuditPayload(before, after)`

## OpenAPI Contract Strategy

The OpenAPI contract is the boundary between backend and frontend.

Source of truth:

- Request/response schemas live in `packages/contracts`.
- API routes attach schemas from `packages/contracts`.
- A contract builder in `packages/contracts` emits route schemas and OpenAPI metadata.
- OpenAPI is generated from the API route registry plus contract metadata.
- The web client is generated from OpenAPI.

Pipeline:

```txt
contracts + api route metadata
  -> openapi.json
  -> generated api-client package
  -> web adapters
  -> domain hooks
  -> screens
```

CI requirements:

- Generate OpenAPI.
- Fail if generated spec has uncommitted diffs.
- Generate client.
- Typecheck API, worker, contracts, domain, db, and web.

Contract rules:

- API JSON uses camelCase.
- Database columns may use snake_case.
- Mappers translate between database rows and contract DTOs.
- Every endpoint has typed success and typed error responses.
- Do not expose database rows directly as API responses.
- Do not import Prisma model types into frontend code.

## API Shape

Use resource-oriented REST for CRUD plus explicit command endpoints for workflow decisions.

Examples:

```txt
GET    /v1/deals
POST   /v1/deals
GET    /v1/deals/{dealId}
PATCH  /v1/deals/{dealId}
GET    /v1/deals/{dealId}/participants
POST   /v1/deals/{dealId}/participants
PATCH  /v1/deals/{dealId}/participants/{participantId}

GET    /v1/deals/{dealId}/messages
GET    /v1/deals/{dealId}/documents
GET    /v1/deals/{dealId}/tasks
GET    /v1/deals/{dealId}/activity

POST   /v1/tasks/{taskId}/approve
POST   /v1/tasks/{taskId}/reject
POST   /v1/tasks/{taskId}/defer
POST   /v1/tasks/{taskId}/route

GET    /v1/routing-review-items
POST   /v1/routing-review-items/{itemId}/resolve

GET    /v1/va-work-items
POST   /v1/va-work-items/{itemId}/submit
POST   /v1/va-work-items/{itemId}/send-back

POST   /v1/webhooks/resend
POST   /v1/webhooks/twilio
```

Rule:

If the action is a state transition with audit or approval implications, prefer an explicit command endpoint over a generic `PATCH`.

## Error Model

Use one typed error envelope:

```ts
type ApiError = {
  code: string
  message: string
  details?: unknown
  requestId: string
}
```

Common codes:

- `unauthorized`
- `forbidden`
- `not_found`
- `validation_failed`
- `conflict`
- `permission_denied`
- `invalid_state_transition`
- `provider_failure`
- `job_failed`
- `internal_error`

Rules:

- Validation errors return structured field errors.
- Permission failures never reveal whether hidden resources exist.
- Frontend adapters normalize API errors into app-level error unions.

## Frontend Architecture

Follow the `ai-frontend-scaffolding` four-layer model.

```txt
Layer 0: Router
Layer 1: Adapters
Layer 2: Domain Hooks
Layer 3: Components
```

### Layer 0: Router

Owns:

- TanStack Router file routes.
- route guards.
- URL search params.
- loader cache seeding.

Rules:

- URL params are the source of truth for filters, selected deal, active tab, table sort, and panel state.
- Route search params are validated with Zod.
- Route files are thin.

### Layer 1: Adapters

Owns:

- wrapping generated OpenAPI client operations.
- mapping generated transport data into frontend domain DTOs.
- unwrapping response envelopes.
- normalizing errors.

Rules:

- Components never call generated client operations directly.
- Domain hooks call adapters, not raw generated functions.

### Layer 2: Domain Hooks

Owns:

- TanStack Query keys.
- cache policy.
- optimistic updates.
- rollback.
- mutation orchestration.
- user-facing error states.

Example hooks:

- `useDeals`
- `useDeal`
- `useUpdateDeal`
- `useDealMessages`
- `useDealDocuments`
- `useDealTasks`
- `useApproveTask`
- `useRoutingReviewQueue`
- `useVaWorkItems`

### Layer 3: Components

Owns:

- rendering.
- layout.
- user events.
- local visual state only.

Rules:

- No server fetching in components.
- No direct OpenAPI client calls.
- No permission decisions beyond hiding/disabling controls based on normalized capability props.
- Components receive `data`, `isPending`, `error`, and callbacks.

## Frontend Route Plan

Initial routes:

```txt
/
/login
/deals
/deals/$dealId
/deals/$dealId/messages
/deals/$dealId/documents
/deals/$dealId/tasks
/deals/$dealId/participants
/deals/$dealId/activity
/routing-review
/va
/settings/users
/settings/organization
```

Route notes:

- `/deals` is the main kanban.
- `/deals/$dealId` is the deal shell with tabs.
- Broker/client users can land on `/deals` but see permission-limited status.
- VA users land on `/va`.
- Detail panel state should live in search params, not hidden component state.

## Feature Package Recipe

Every new feature should follow this path:

1. Define or update contract schemas in `packages/contracts`.
2. Add or update domain rules in `packages/domain`.
3. Add database schema/migration/repository in `packages/db`.
4. Add service command/query in the owning API module.
5. Add permission checks in service layer.
6. Add audit/approval/outcome event writes if the feature mutates state.
7. Register Fastify route and attach contract validation.
8. Regenerate OpenAPI.
9. Regenerate `packages/api-client`.
10. Add frontend adapter.
11. Add frontend domain hook.
12. Build or update route/screen.
13. Add unit, integration, and e2e coverage appropriate to risk.

If a feature cannot follow this recipe, it probably needs an architecture decision before implementation.

## Background Jobs

Initial async work:

- Resend inbound email ingestion.
- Twilio SMS/voice webhook ingestion.
- attachment storage.
- OCR/PDF extraction.
- document type classification.
- low-confidence routing review creation.
- next-action proposal generation.
- System draft generation.

Rules:

- Job payload schemas live in `packages/jobs`.
- Jobs are idempotent where possible.
- Jobs write audit events for visible state changes.
- Jobs never bypass permissions for user-initiated actions.
- Provider payload parsing happens before normalized commands hit the domain layer.

## AI-Assisted Work

AI-assisted features are application services and jobs, not freeform database writers.

Rules:

- AI output is validated against typed schemas.
- AI suggestions create proposed records or drafts.
- Approval workflows apply or send those records.
- The app owns final writes.
- AI does not sit in the hot path for message-to-deal routing.

Initial AI-assisted services:

- summarize context.
- extract deal facts.
- classify document type after filing.
- recommend stage change.
- recommend one next action.
- draft outbound message.
- help resolve low-confidence routing.

## Testing Strategy

### Unit Tests

Use for:

- domain rules.
- permission evaluation.
- mappers.
- contract schemas.
- repository query helpers where useful.

### API Integration Tests

Use for:

- route validation.
- permissions.
- command endpoints.
- transaction behavior.
- audit/approval/outcome writes.

Run against a real PostgreSQL test database.

### Worker Tests

Use for:

- job payload validation.
- idempotency.
- provider parsing.
- OCR/classification state transitions.

### Frontend Tests

Use for:

- domain hooks.
- adapters.
- route search param validation.
- high-value screen behavior.

### E2E Tests

Initial e2e flows:

1. AM creates deal, adds broker/client, sets permissions.
2. Broker/client logs in and sees permission-limited kanban/status.
3. Inbound email routes to deal and files attachment.
4. Low-confidence message enters routing review and is resolved.
5. AM approves System draft outbound message.
6. AM routes task to VA, VA submits work, AM approves.

## Local Development

Local services:

- PostgreSQL.
- S3-compatible object storage, with MinIO or local file-backed storage for dev.
- API.
- worker.
- web.

Useful commands should exist at the repo root:

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

## Source-of-Truth Docs Still Needed

Before building the frontend screens, create the frontend source-of-truth docs from the scaffolding workflow:

- `docs/design-philosophy.md`
- `docs/design-system.md`
- `docs/frontend-architecture.md`
- `CLAUDE.md`

For now, this architecture doc owns the full-stack decisions. The future frontend docs should refine visual design, route specifics, screen contracts, and AI guidance without contradicting this architecture.

## Decision Log

1. Use TypeScript across web, API, worker, contracts, domain, and database packages.
2. Use a Node API instead of Python/FastAPI for the initial rebuild.
3. Use OpenAPI as the backend/frontend contract.
4. Generate the frontend API client from OpenAPI.
5. Use Fastify for HTTP route composition.
6. Use Better Auth for authentication.
7. Use Zod for runtime validation and contract schemas.
8. Use Prisma with PostgreSQL for typed persistence.
9. Use explicit command endpoints for audited workflow transitions.
10. Keep frontend components dumb; data and mutations live in adapters/hooks.
11. Keep AI-assisted work behind typed app workflows and approval gates.
12. Use `pg-boss` for the initial background job runtime.
13. Use S3-compatible object storage behind `packages/storage`.
14. Use Resend for inbound and outbound email.
15. Use Twilio for SMS and voice transcript ingestion.
16. Use `janhesters/shadcn-kanban-board` as the base for the deal kanban UI.

## Open Architecture Questions

1. What is the first deployment target: Railway, a single VPS/container host, AWS ECS/Fargate, or another managed platform?
