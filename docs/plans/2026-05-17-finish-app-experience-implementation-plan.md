# Finish App Experience Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the current CTW 2.0 build from a partially wired prototype into a coherent, API-backed app experience where visible controls work, navigation is guarded, mutations give feedback, and empty/loading/error states feel intentional.

**Architecture:** Keep the existing four-layer frontend architecture from `docs/frontend-architecture.md`: routes own URL state and prefetching, adapters wrap the generated API client, hooks own TanStack Query plus optimistic updates/toasts, and components stay presentational. Add only the small typed backend/API gaps needed for app-level search and notification/queue summaries; otherwise wire the UI to the CRUD and workflow endpoints that already exist.

**Tech Stack:** Vite, React, TanStack Router, TanStack Query, local shadcn-style UI primitives, `sonner` toasts, lucide icons, TypeScript, OpenAPI contracts, Prisma-backed Node API, Playwright browser E2E.

---

## Source Of Truth

Read these before touching code:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/feature-plan.md`
- `docs/crud-model.md`
- `docs/data-model.md`
- `docs/architecture.md`
- `docs/frontend-architecture.md`
- `docs/design-system.md`
- `docs/screens.md`
- `docs/plans/2026-05-17-make-it-real-implementation-plan.md`

Implementation rules:

- Commit after each task or tight task group.
- After each milestone, run one subagent review. Allow up to 5 review/fix passes for that milestone before moving on.
- Never leave a visible clickable control dead. If a control is not in scope, remove it or route it to a real disabled/unavailable state with a clear reason.
- Every clickable button/control must have hover, focus-visible, active, disabled, and loading/pending treatment where applicable.
- Use toasts for mutations and failures that happen outside the current form field.
- Use spinners or skeletons for pending work; never make users wonder whether a click registered.
- Preserve URL search params as the source of truth for filters, selected rows/items, active tabs, and panel state.

Baseline commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm openapi:generate
pnpm client:generate
pnpm --filter @ctw/web e2e:browser
```

---

## Milestone 1: Experience Inventory And Test Harness

**Goal:** Identify every currently visible dead or misleading control and pin the desired behavior in browser tests before wiring.

**Files:**

- Modify: `apps/web/e2e/browser/app-shell.spec.ts`
- Modify: `apps/web/e2e/browser/deal-workspace-crud.spec.ts`
- Modify: `apps/web/e2e/browser/ingestion-routing.spec.ts`
- Modify: `apps/web/e2e/browser/task-va-flow.spec.ts`
- Modify: `apps/web/e2e/browser/auth-permissions.spec.ts`
- Create: `apps/web/e2e/browser/experience-completeness.spec.ts`
- Modify: `docs/plans/2026-05-17-finish-app-experience-implementation-plan.md`

### Task 1.1: Add a dead-control audit test

Write a browser test that logs in as each seeded role and verifies the main visible controls either navigate, open a panel/dialog/menu, trigger a mutation, or expose a disabled reason.

Cover:

- App shell search input/button.
- App shell notification button/count.
- App shell sign out.
- Settings nav.
- Deals filter chips.
- Deals scoped search.
- New deal.
- Kanban card open.
- Kanban move.
- Workspace next action controls.
- Routing review row and actions.
- VA row and actions.
- Settings user/org actions.

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- experience-completeness.spec.ts
```

Expected now: fail on multiple dead controls.

### Task 1.2: Add hover/focus coverage

Extend `experience-completeness.spec.ts` with a helper that checks common clickable selectors gain a non-default visual style on hover and have a visible focus state.

Selectors to start with:

```ts
[
  "button:not([disabled])",
  "a.nav-item",
  ".filter-chip",
  ".kanban-card",
  ".queue-row",
  ".workspace-tab",
  ".crud-row",
  ".icon-button"
]
```

Use computed styles before/after hover for at least one of:

- background color
- border color
- box shadow
- color
- transform

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- experience-completeness.spec.ts
```

Expected now: fail on controls without hover treatment.

### Task 1.3: Commit milestone test baseline

```bash
git add apps/web/e2e/browser docs/plans/2026-05-17-finish-app-experience-implementation-plan.md
git commit -m "test: capture unfinished app experience controls"
```

### Milestone 1 Review

Ask one subagent to review only the tests and inventory:

- Do the tests catch dead visible controls?
- Do they avoid brittle text coupling where roles differ?
- Are hover/focus assertions meaningful without being pixel-perfect?

Fix review findings, rerun targeted browser tests, and commit fixes.

---

## Milestone 2: App Foundation Feedback System

**Goal:** Provide consistent app-wide hover states, toasts, spinners, loading buttons, auth redirects, and mutation error handling.

**Files:**

- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/router.tsx`
- Modify: `apps/web/src/routes/index.tsx`
- Modify: `apps/web/src/components/app-shell.tsx`
- Modify: `apps/web/src/components/ui/button.tsx`
- Create: `apps/web/src/components/ui/spinner.tsx`
- Create: `apps/web/src/components/ui/toaster.tsx`
- Create: `apps/web/src/components/ui/confirm-dialog.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/hooks/use-current-session.ts`
- Modify: `apps/web/src/hooks/use-deals.ts`
- Modify: `apps/web/src/lib/query-client.ts`
- Modify: `apps/web/src/router.test.ts`
- Modify: `apps/web/src/lib/api/runtime.test.ts`

### Task 2.1: Add app-level auth guards

Write tests showing:

- Direct `/deals` without a session redirects to `/login`.
- Direct `/routing-review` without capability redirects to the role home or shows a permission page.
- Direct `/settings/organization` without capability does not render the admin settings UI.

Implement TanStack Router guards in route definitions or route wrappers. Keep `/login` public.

Run:

```bash
pnpm --filter @ctw/web test -- router.test.ts
pnpm --filter @ctw/web e2e:browser -- auth-permissions.spec.ts
```

### Task 2.2: Add toast provider

Mount `sonner` once at app root through a local `Toaster` component.

Expected behavior:

- Success toasts for create/update/move/file/submit/accept.
- Error toasts for failed mutations.
- Undo toasts for reversible actions where the underlying API supports rollback by issuing the inverse mutation.

Run:

```bash
pnpm --filter @ctw/web test -- use-current-session use-deals
```

### Task 2.3: Add spinner and loading button states

Update `Button` to support:

```ts
type ButtonProps = {
  isLoading?: boolean;
  loadingLabel?: string;
}
```

When `isLoading` is true:

- Disable the button.
- Render a small spinner.
- Preserve button width enough to avoid obvious layout jump.
- Keep accessible text via visible label or `aria-label`.

Add `Spinner` primitive for inline and page usage.

Run:

```bash
pnpm --filter @ctw/web test -- button
pnpm --filter @ctw/web e2e:browser -- experience-completeness.spec.ts
```

### Task 2.4: Normalize hover, focus, active, disabled CSS

Audit and update CSS for:

- `.button`
- `.icon-button`
- `.nav-item`
- `.filter-chip`
- `.kanban-card`
- `.queue-row`
- `.workspace-tab`
- `.crud-row`
- `.upload-button`
- `.settings-action`
- `.dropdown-item`
- `.dialog button`

Each clickable state must have visible hover and focus-visible treatment. Disabled controls must look disabled and must not use hover affordances.

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- experience-completeness.spec.ts
```

### Task 2.5: Commit foundation

```bash
git add apps/web/src apps/web/e2e/browser
git commit -m "feat: add app feedback and guarded navigation"
```

### Milestone 2 Review

Ask one subagent to review:

- Auth guard correctness.
- Toast/spinner accessibility.
- Hover/focus coverage.
- Whether the foundation creates duplicated mutation feedback logic.

Fix review findings, rerun `pnpm --filter @ctw/web test` and targeted E2E, then commit.

---

## Milestone 3: Typed Search And App Summary API

**Goal:** Make app shell search and notification counts real without creating frontend-only fakery.

**Files:**

- Create: `packages/contracts/src/search/search.schemas.ts`
- Create: `packages/contracts/src/search/search.contract.ts`
- Create: `packages/contracts/src/app-summary/app-summary.schemas.ts`
- Create: `packages/contracts/src/app-summary/app-summary.contract.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/src/openapi.ts`
- Create: `apps/api/src/modules/search/search.service.ts`
- Create: `apps/api/src/modules/search/search.routes.ts`
- Create: `apps/api/src/modules/search/search.integration.test.ts`
- Create: `apps/api/src/modules/app-summary/app-summary.service.ts`
- Create: `apps/api/src/modules/app-summary/app-summary.routes.ts`
- Create: `apps/api/src/modules/app-summary/app-summary.integration.test.ts`
- Modify: `apps/api/src/server.ts`
- Create: `apps/web/src/lib/api/adapters/search.ts`
- Create: `apps/web/src/lib/api/adapters/app-summary.ts`
- Create: `apps/web/src/hooks/use-global-search.ts`
- Create: `apps/web/src/hooks/use-app-summary.ts`
- Modify: `apps/web/src/components/app-shell.tsx`
- Modify: `apps/web/e2e/browser/app-shell.spec.ts`

### Task 3.1: Contract-first search endpoint

Add `GET /v1/search?q=&scope=` returning typed results:

```ts
type SearchResult = {
  id: string;
  type: "deal" | "participant" | "document" | "message";
  label: string;
  secondaryLabel?: string;
  dealId?: string;
  href: string;
}
```

Respect the current session capabilities. Broker/client results must only include visible deals and visible deal artifacts.

Run:

```bash
pnpm --filter @ctw/contracts test
pnpm --filter @ctw/api test -- search.integration.test.ts
pnpm openapi:generate
pnpm client:generate
```

### Task 3.2: Contract-first app summary endpoint

Add `GET /v1/app-summary` returning:

```ts
type AppSummary = {
  routingReviewCount: number;
  pendingApprovalCount: number;
  vaQueueCount: number;
  recentItems: Array<{
    id: string;
    label: string;
    href: string;
    kind: "routing_review" | "approval" | "va_work";
  }>;
}
```

Respect capability filtering. Do not leak hidden counts to brokers/clients.

Run:

```bash
pnpm --filter @ctw/api test -- app-summary.integration.test.ts
pnpm openapi:generate
pnpm client:generate
```

### Task 3.3: Wire app shell search

Replace static `.search-box` copy with an accessible command/search popover:

- Typing at least 2 characters queries the API.
- Pending state shows an inline spinner.
- Empty state says no matches.
- Result click navigates to its `href`.
- Keyboard support: ArrowDown, ArrowUp, Enter, Escape.
- Errors show a toast and inline retry state.

Run:

```bash
pnpm --filter @ctw/web test -- use-global-search
pnpm --filter @ctw/web e2e:browser -- app-shell.spec.ts
```

### Task 3.4: Wire notification indicator

Replace hardcoded `3 messages to review` with app summary data:

- If count is zero, show no badge or a neutral empty popover.
- If count is positive, label it with the highest-priority queue.
- Clicking notification opens a popover with scoped links.
- All loading states use spinner/skeleton.

Run:

```bash
pnpm --filter @ctw/web test -- use-app-summary
pnpm --filter @ctw/web e2e:browser -- app-shell.spec.ts
```

### Task 3.5: Commit search and summary

```bash
git add packages/contracts apps/api/src apps/web/src apps/web/e2e/browser
git commit -m "feat: add typed search and app summary"
```

### Milestone 3 Review

Ask one subagent to review:

- Search permission filtering.
- OpenAPI/client generation.
- App shell UX for loading/error/empty states.
- Any count leaks across roles.

Fix review findings, rerun contract/API/web tests, and commit.

---

## Milestone 4: Deals Kanban Becomes Fully Usable

**Goal:** Make `/deals` a real working home screen: filters, search, create, drag feedback, undo, and empty/error states.

**Files:**

- Modify: `apps/web/src/routes/deals.tsx`
- Modify: `apps/web/src/hooks/use-deals.ts`
- Modify: `apps/web/src/lib/api/adapters/deals.ts`
- Modify: `apps/web/src/components/ui/kanban.tsx`
- Create: `apps/web/src/features/deals/create-deal-dialog.tsx`
- Create: `apps/web/src/features/deals/deal-filters.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/routes/deals.test.tsx`
- Modify: `apps/web/e2e/browser/deal-workspace-crud.spec.ts`

### Task 4.1: URL-backed filters and scoped search

Replace static filter chips with real URL search params:

- `q`
- `owner`
- `stage`
- `stale`
- `pendingApproval`
- `participantCompany`

Filters must update the URL and refetch or locally filter depending on adapter support. Search must be scoped to visible deals.

Run:

```bash
pnpm --filter @ctw/web test -- deals.test.tsx
pnpm --filter @ctw/web e2e:browser -- deal-workspace-crud.spec.ts
```

### Task 4.2: New deal dialog

Wire `New deal` to a dialog with:

- title
- primary company
- stage
- owner if admin
- optional source note

On submit:

- show loading on the submit button
- create via API
- toast success
- close dialog
- navigate to the new workspace or insert card in kanban

Run:

```bash
pnpm --filter @ctw/web test -- deals.test.tsx
pnpm --filter @ctw/web e2e:browser -- deal-workspace-crud.spec.ts
```

### Task 4.3: Improve kanban move feedback

Use toasts for stage moves:

- optimistic card movement
- spinner/badge on moving card
- valid drop column highlight
- invalid drop reason
- undo toast for the inverse stage move
- error toast plus rollback

Run:

```bash
pnpm --filter @ctw/web test -- deals.test.tsx
pnpm --filter @ctw/web e2e:browser -- deal-workspace-crud.spec.ts
```

### Task 4.4: Role-limited kanban polish

Ensure:

- brokers/clients see only allowed deals
- drag handles are hidden when stage move is not allowed
- create deal is hidden without permission
- counts do not leak hidden deals

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- auth-permissions.spec.ts
```

### Task 4.5: Commit kanban experience

```bash
git add apps/web/src apps/web/e2e/browser
git commit -m "feat: complete deals kanban interactions"
```

### Milestone 4 Review

Ask one subagent to review:

- URL param correctness.
- Permission-limited rendering.
- Kanban move rollback/undo.
- Whether all clickable filters/buttons have hover, focus, and loading states.

Fix review findings, rerun targeted tests, and commit.

---

## Milestone 5: Deal Workspace Actions And CRUD Polish

**Goal:** Finish the deal workspace so the next action panel, tabs, and CRUD flows are coherent and mutation-backed.

**Files:**

- Modify: `apps/web/src/features/deal-workspace/workspace-shell.tsx`
- Modify: `apps/web/src/features/deal-workspace/tasks-tab.tsx`
- Modify: `apps/web/src/features/deal-workspace/participants-tab.tsx`
- Modify: `apps/web/src/features/deal-workspace/documents-tab.tsx`
- Modify: `apps/web/src/features/deal-workspace/messages-tab.tsx`
- Modify: `apps/web/src/features/deal-workspace/activity-tab.tsx`
- Modify: `apps/web/src/features/deal-workspace/panel-search.ts`
- Modify: `apps/web/src/routes/deals.$dealId.tsx`
- Modify: `apps/web/src/routes/deals.$dealId.tasks.tsx`
- Modify: `apps/web/src/routes/deals.$dealId.documents.tsx`
- Modify: `apps/web/src/routes/deals.$dealId.participants.tsx`
- Modify: `apps/web/src/routes/deals.$dealId.messages.tsx`
- Modify: `apps/web/src/routes/deals.$dealId.activity.tsx`
- Modify: `apps/web/src/hooks/use-deals.ts`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/features/deal-workspace/tabs.test.ts`
- Modify: `apps/web/e2e/browser/deal-workspace-crud.spec.ts`
- Modify: `apps/web/e2e/browser/task-va-flow.spec.ts`

### Task 5.1: Wire overview next action controls

Replace static overview/header controls with the same task mutation path used by `tasks-tab.tsx`.

Expected behavior:

- Primary action opens preview when the action is high-stakes.
- Approve/complete/defer/route mutate through hooks.
- Loading state is visible on the clicked control.
- Success/error toasts appear.
- The next action updates in place.

Run:

```bash
pnpm --filter @ctw/web test -- tabs.test.ts
pnpm --filter @ctw/web e2e:browser -- task-va-flow.spec.ts
```

### Task 5.2: Finish participant CRUD UX

Ensure participants tab supports:

- add participant
- edit role/visibility/contact fields
- remove/archive when allowed
- loading button states
- success/error toasts
- confirmation for destructive removal

Run:

```bash
pnpm --filter @ctw/web test -- tabs.test.ts
pnpm --filter @ctw/web e2e:browser -- deal-workspace-crud.spec.ts
```

### Task 5.3: Finish document CRUD UX

Ensure documents tab supports:

- upload/file document
- edit document type/status/visibility
- archive document with confirmation
- async classification status display
- spinners during upload/update
- toasts on success/error

Run:

```bash
pnpm --filter @ctw/web test -- tabs.test.ts
pnpm --filter @ctw/web e2e:browser -- deal-workspace-crud.spec.ts
```

### Task 5.4: Finish messages UX

Ensure messages tab supports:

- filter/search via URL params
- detail panel via URL params
- update visibility/classification where allowed
- route/file message links
- low-confidence badge links to routing review
- spinners/toasts for mutations

Run:

```bash
pnpm --filter @ctw/web test -- tabs.test.ts
pnpm --filter @ctw/web e2e:browser -- ingestion-routing.spec.ts
```

### Task 5.5: Commit workspace polish

```bash
git add apps/web/src apps/web/e2e/browser
git commit -m "feat: complete deal workspace actions"
```

### Milestone 5 Review

Ask one subagent to review:

- Next action consistency between overview and tasks tab.
- CRUD loading/error/empty states.
- Confirmation usage only for destructive/high-stakes work.
- Permission hiding vs disabled controls.

Fix review findings, rerun targeted tests, and commit.

---

## Milestone 6: Routing Review Queue Becomes Real

**Goal:** Replace the static routing review mock with a real queue that lets AM/admin users file messages quickly.

**Files:**

- Modify: `apps/web/src/routes/routing-review.tsx`
- Create: `apps/web/src/lib/api/adapters/routing-review.ts`
- Create: `apps/web/src/hooks/use-routing-review.ts`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/e2e/browser/ingestion-routing.spec.ts`
- Modify: `apps/web/e2e/ingestion-routing.spec.ts`

### Task 6.1: API-backed queue and selected row URL state

Wire the route to `routing-review` endpoints:

- list queue items
- select item through `?itemId=`
- show message/source details
- show suggested deal matches
- show threshold copy from org settings

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- ingestion-routing.spec.ts
```

### Task 6.2: Wire routing actions

Implement:

- assign to existing deal
- create deal from message
- mark unrelated

Each action must:

- show loading on the clicked button
- optimistically remove or update the queue item
- toast success with undo when reversible
- toast error and restore the row on failure

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- ingestion-routing.spec.ts
pnpm --filter @ctw/web e2e -- ingestion-routing.spec.ts
```

### Task 6.3: Empty and permission states

Ensure:

- empty queue state is useful and compact
- AM/admin only can act
- unauthorized users cannot load the route directly
- counts refresh in app shell after resolution

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- auth-permissions.spec.ts app-shell.spec.ts
```

### Task 6.4: Commit routing review

```bash
git add apps/web/src apps/web/e2e
git commit -m "feat: wire routing review queue"
```

### Milestone 6 Review

Ask one subagent to review:

- Queue state transitions.
- Race conditions when resolving the selected item.
- Toast/undo behavior.
- Permission filtering.

Fix review findings, rerun targeted tests, and commit.

---

## Milestone 7: VA Queue Becomes Real

**Goal:** Replace the static VA queue with role-aware VA work execution and AM/admin review.

**Files:**

- Modify: `apps/web/src/routes/va.tsx`
- Create: `apps/web/src/lib/api/adapters/va-work.ts`
- Create: `apps/web/src/hooks/use-va-work.ts`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/e2e/browser/task-va-flow.spec.ts`
- Modify: `apps/web/e2e/va-work.spec.ts`
- Modify: `apps/web/e2e/task-execution.spec.ts`

### Task 7.1: API-backed VA queue and selected row URL state

Wire:

- queued items
- in-progress items
- submitted items
- selected work item via `?workId=`
- detail panel with deal link and handoff history

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- task-va-flow.spec.ts
```

### Task 7.2: Wire VA worker actions

For VA users:

- accept/start work
- submit completion note/result
- cancel or return to queue where allowed

Each action must use loading buttons, update in place, and show toasts.

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- task-va-flow.spec.ts
pnpm --filter @ctw/web e2e -- va-work.spec.ts
```

### Task 7.3: Wire AM/admin review actions

For AM/admin users:

- accept submitted work
- send back with reason
- view-only where they should not perform VA-owned execution

Use confirmation only where the action is hard to reverse. Refresh app summary counts after mutations.

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- task-va-flow.spec.ts
pnpm --filter @ctw/web e2e -- task-execution.spec.ts
```

### Task 7.4: Commit VA queue

```bash
git add apps/web/src apps/web/e2e
git commit -m "feat: wire va queue workflow"
```

### Milestone 7 Review

Ask one subagent to review:

- Role-specific action visibility.
- VA status transitions.
- Review/submit error handling.
- App shell count refresh.

Fix review findings, rerun targeted tests, and commit.

---

## Milestone 8: Settings, Permissions, And Account Polish

**Goal:** Make settings feel real and safe: role-aware settings pages, working settings nav, confirmations for risky changes, and clear feedback.

**Files:**

- Modify: `apps/web/src/routes/settings.tsx`
- Modify: `apps/web/src/routes/settings.users.tsx`
- Create or modify: `apps/web/src/routes/settings.organization.tsx`
- Modify: `apps/web/src/features/settings/users-settings-screen.tsx`
- Modify: `apps/web/src/features/settings/organization-settings-screen.tsx`
- Modify: `apps/web/src/lib/api/adapters/settings.ts`
- Create: `apps/web/src/hooks/use-settings.ts`
- Modify: `apps/web/src/components/app-shell.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/features/settings/settings.test.ts`
- Modify: `apps/web/e2e/browser/auth-permissions.spec.ts`

### Task 8.1: Settings home and nav behavior

Ensure:

- settings nav routes to the best allowed settings page
- admins see users and organization tabs
- AMs see only allowed user-management settings
- brokers/clients do not see settings if they lack capability
- direct blocked URLs redirect or show a clear permission page

Run:

```bash
pnpm --filter @ctw/web test -- settings.test.ts
pnpm --filter @ctw/web e2e:browser -- auth-permissions.spec.ts
```

### Task 8.2: Users settings polish

Wire or verify:

- invite/create user
- change role
- disable user with confirmation
- permissions preview before role changes
- loading buttons
- success/error toasts

Run:

```bash
pnpm --filter @ctw/web test -- settings.test.ts
pnpm --filter @ctw/web e2e:browser -- auth-permissions.spec.ts
```

### Task 8.3: Organization settings polish

Wire or verify:

- routing confidence threshold
- organization display/settings fields
- save/cancel dirty state
- impact preview for threshold changes
- loading buttons and toasts

Run:

```bash
pnpm --filter @ctw/web test -- settings.test.ts
pnpm --filter @ctw/web e2e:browser -- auth-permissions.spec.ts
```

### Task 8.4: Commit settings polish

```bash
git add apps/web/src apps/web/e2e/browser
git commit -m "feat: finish settings experience"
```

### Milestone 8 Review

Ask one subagent to review:

- Permission model UI enforcement.
- Risky settings confirmations.
- Threshold behavior and copy.
- Whether any settings controls remain decorative.

Fix review findings, rerun targeted tests, and commit.

---

## Milestone 9: Replace API-Shortcut Browser Tests With Real UI Flows

**Goal:** Prove the app can be used through the browser without test-only API shortcuts except for login/seed setup.

**Files:**

- Modify: `apps/web/e2e/browser/helpers.ts`
- Modify: `apps/web/e2e/browser/app-shell.spec.ts`
- Modify: `apps/web/e2e/browser/deal-workspace-crud.spec.ts`
- Modify: `apps/web/e2e/browser/ingestion-routing.spec.ts`
- Modify: `apps/web/e2e/browser/task-va-flow.spec.ts`
- Modify: `apps/web/e2e/browser/auth-permissions.spec.ts`
- Modify: `apps/web/e2e/browser/experience-completeness.spec.ts`

### Task 9.1: Remove UI-flow API shortcuts

Keep API helpers only for:

- deterministic seed setup
- login/session setup if the auth UI itself is covered elsewhere

Move the actual user journeys through the UI:

- create deal
- move deal
- add/edit participant
- upload/edit/archive document
- approve/defer/route task
- route low-confidence message
- accept/submit/review VA work
- update settings

Run:

```bash
pnpm --filter @ctw/web e2e:browser
```

### Task 9.2: Add full smoke journey

Create a single browser spec that logs in as AM/admin and exercises:

1. App shell search.
2. Create deal.
3. Move deal on kanban.
4. Open workspace.
5. Add participant.
6. File document.
7. Resolve routing review item.
8. Review VA submission.
9. Update a safe setting.
10. Sign out.

Run:

```bash
pnpm --filter @ctw/web e2e:browser -- experience-completeness.spec.ts
```

### Task 9.3: Commit E2E real-user flows

```bash
git add apps/web/e2e/browser
git commit -m "test: cover app experience through real ui flows"
```

### Milestone 9 Review

Ask one subagent to review:

- Whether tests are exercising the UI rather than implementation shortcuts.
- Whether failures would catch the issues the user reported.
- Whether tests are stable enough for local development.

Fix review findings, rerun browser E2E, and commit.

---

## Milestone 10: Final Production-Readiness Pass

**Goal:** Verify the app is honest about its production readiness and close the last obvious UX gaps.

**Files:**

- Modify as needed based on findings.
- Modify: `docs/operations/runbook.md`
- Modify: `docs/deployment.md`
- Modify: `README.md` if present.
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

### Task 10.1: Run full checks

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm openapi:generate
pnpm client:generate
pnpm --filter @ctw/web e2e:browser
docker compose config
```

If Docker/Postgres is available, also run the full production-like stack smoke:

```bash
docker compose up --build
```

Then smoke the app in the browser at the running web URL.

### Task 10.2: Manual UX checklist

Manually verify:

- Direct protected routes redirect instead of showing broken API errors.
- Every visible button/control has hover and focus-visible treatment.
- Every mutation has a spinner/loading state or clear pending state.
- Every mutation produces a toast or in-place confirmation.
- Search returns real results and handles empty/error states.
- Settings button/nav works.
- Kanban drag/drop works for permitted users and is hidden for others.
- Routing review actions work.
- VA queue actions work.
- Broker/client views do not leak internal counts/actions.
- No screen shows static placeholder counts or fake data.

### Task 10.3: Update docs

Update docs with:

- current local dev URL expectations
- required commands for typecheck, OpenAPI generation, client generation, tests, E2E
- production-readiness caveats if any remain
- what is intentionally deferred

### Task 10.4: Final review and commit

Ask one subagent for final review:

- Is the implementation consistent with source-of-truth docs?
- Are visible UX gaps closed?
- Are there remaining fake controls/data?
- Are commands/docs accurate?

Fix findings, rerun full checks, then commit:

```bash
git add .
git commit -m "chore: finalize app experience readiness"
```

---

## Definition Of Done

The work is complete only when:

- Users can use the app through the browser without discovering obvious dead controls.
- Protected routes do not render broken authenticated pages to logged-out users.
- Search, notification, settings, kanban, routing review, VA queue, and workspace actions are backed by typed API calls.
- Every clickable control has visible hover and focus-visible states.
- Mutations use loading states and toasts consistently.
- Browser E2E covers real UI journeys rather than API-shortcutting the product experience.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, OpenAPI/client generation, and browser E2E pass.
- A subagent review has completed after every milestone, with at most 5 fix/review passes per milestone.
- Changes are committed incrementally.

## Progress

- [x] Plan written.
- [x] Milestone 1: Experience Inventory And Test Harness. Existing browser specs were tightened and an app-shell interactivity spec was added; no subagent review per user instruction.
- [x] Milestone 2: App Foundation Feedback System.
- [x] Milestone 3: Typed Search And App Summary API. Implemented as typed frontend adapters/hooks over existing typed endpoints instead of adding new backend endpoints.
- [x] Milestone 4: Deals Kanban Becomes Fully Usable.
- [x] Milestone 5: Deal Workspace Actions And CRUD Polish.
- [x] Milestone 6: Routing Review Queue Becomes Real.
- [x] Milestone 7: VA Queue Becomes Real.
- [x] Milestone 8: Settings, Permissions, And Account Polish.
- [x] Milestone 9: Replace API-Shortcut Browser Tests With Real UI Flows. Browser coverage now passes for the real app surfaces; some API helpers remain for deterministic setup/assertions.
- [x] Milestone 10: Final Production-Readiness Pass.

Completion notes:

- Subagent reviews were intentionally skipped because the user requested no subagents.
- Browser E2E now runs in deterministic memory mode locally so it does not require Docker/Postgres just to validate frontend flows.
- Full verification passed: lint, typecheck, unit tests, build, OpenAPI/client generation, and browser E2E.
