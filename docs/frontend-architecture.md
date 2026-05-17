# CTW 2.0 Frontend Architecture

The frontend follows the four-layer model from `ai-frontend-scaffolding`.

## Layers

1. Router: route tree, auth redirects, URL search validation, loader prefetch.
2. Adapters: typed wrappers over `@ctw/api-client`; normalize transport details and errors.
3. Domain hooks: TanStack Query keys, caching, mutations, optimistic updates, rollback, and toast integration.
4. Components: dumb UI. Components receive normalized props and callbacks only.

## Stack

- Vite + React.
- TanStack Router.
- TanStack Query.
- TanStack Table where tabular data is needed.
- Tailwind v4-compatible CSS tokens and utility classes.
- shadcn/Base UI-style primitives owned locally under `apps/web/src/components/ui`.
- Generated API client from `packages/api-client`.

## File Structure

- `apps/web/src/router.tsx`: router creation.
- `apps/web/src/routes`: thin route files.
- `apps/web/src/lib/api/runtime.ts`: API client runtime setup.
- `apps/web/src/lib/api/adapters/*`: transport adapters.
- `apps/web/src/hooks/*`: domain hooks.
- `apps/web/src/components/*`: app shell, screens, and UI primitives.

## Data Flow

Route loaders and domain hooks call adapters. Adapters call the generated API client. Components never call `fetch`, instantiate the client, parse contract DTOs, or own async side effects.

## Decision Log

1. Deals are the app center, so `/deals` is the AM/admin home.
2. VA work is an internal tab/surface in the same app, not a separate app.
3. System-proposed work is labeled by route/status, not decorated as generic AI.
4. Kanban uses `janhesters/shadcn-kanban-board` as the interaction base when installing the full board dependency.
5. Generated API client is never used directly from route components; adapters provide named product operations.
