# CTW 2.0 Frontend Rules

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
