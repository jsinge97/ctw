# CTW 2.0 Frontend Rules

For repository-wide agent instructions, start with `AGENTS.md`.

Read these source docs before frontend work:

- `docs/feature-plan.md`
- `docs/crud-model.md`
- `docs/data-model.md`
- `docs/architecture.md`
- `docs/screens.md`
- `docs/design-reference-notes.md`
- `docs/design-philosophy.md`
- `docs/design-system.md`
- `docs/frontend-architecture.md`
- `docs/plans/2026-05-17-make-it-real-implementation-plan.md`

## Command Quick Reference

Use these from the repository root unless a task says otherwise:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @ctw/api test
pnpm --filter @ctw/web test
pnpm --filter @ctw/web e2e
pnpm --filter @ctw/mcp test
pnpm --filter @ctw/mcp dev
pnpm --filter @ctw/mcp start
pnpm resend:smoke
pnpm --filter @ctw/worker test
pnpm --filter @ctw/worker health
pnpm prisma:generate
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:reset
pnpm openapi:generate
pnpm client:generate
pnpm build
docker compose up -d postgres minio
docker compose config
```

Expected durable local flow after the seed lifecycle lands:

```bash
docker compose up -d postgres minio
pnpm db:migrate
pnpm db:seed
pnpm --filter @ctw/api dev
pnpm --filter @ctw/worker dev
pnpm --filter @ctw/web dev
pnpm --filter @ctw/mcp dev
```

Docker compose now runs the durable stack by default:

```bash
docker compose up api worker web
```

Local MCP HTTP server:

```bash
CTW_MCP_API_BASE_URL=http://127.0.0.1:3000 CTW_MCP_API_TOKEN=am-token pnpm --filter @ctw/mcp dev
```

The MCP endpoint is `http://127.0.0.1:3010/mcp`.

Resend smoke test:

```bash
RESEND_API_KEY=re_xxxxxxxxx RESEND_FROM_EMAIL=onboarding@resend.dev RESEND_TEST_TO=you@example.com pnpm resend:smoke
```

Regeneration rules:

- Run `pnpm prisma:generate` after Prisma schema changes.
- Run `pnpm openapi:generate` after contract or API route contract changes.
- Run `pnpm client:generate` after OpenAPI changes.
- Never hand-edit generated Prisma client or generated API client files.

## Stack

Use Vite, React, TanStack Router, TanStack Query, TanStack Table, generated `@ctw/api-client`, local shadcn/Base UI-style primitives, and Tailwind-compatible CSS tokens.

## Architecture Rules

- Router owns URL state, auth redirects, search params, and loader prefetch.
- Adapters wrap the generated API client.
- Domain hooks own TanStack Query keys, mutations, cache updates, and rollback.
- Components receive data, loading/error state, and callbacks only.
- No component-level `fetch`.
- No `useEffect` for data fetching.
- No role-string UI logic when capabilities are available.
- No local-only tab/filter/selected-item state when URL params can own it.

## UI Rules

- Build the actual app surface first, not a landing page.
- Keep CTW dense, operational, and permission-aware.
- Hide unavailable actions instead of rendering disabled clutter.
- Show one next action per deal.
- Use icons in controls when the icon is familiar.
- Keep cards compact and do not nest cards.
- Confirm archive, redact, outbound send, disabling users, and permission changes.
- Use visible feedback for every mutation.
