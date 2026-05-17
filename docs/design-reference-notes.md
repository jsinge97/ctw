# Directional Design Reference Notes

Source: `/Users/js/Downloads/task-cre.zip`, reviewed May 17, 2026.

This zip is a directional reference only. Do not copy its code, global component patterns, custom CSS utilities, hard-coded data, or exact visual treatment into the production app. Use it to clarify the desired shape of the product: dense, operational, shadcn-like, and organized around deal work.

## What It Gets Directionally Right

1. The app should feel like an operations console, not a marketing product.

   The strongest direction is the shell: left navigation, compact top/header area, filter bars, dense lists, and right-side detail panels. This matches CTW's workflows better than a loose card dashboard.

2. The deal remains the center of the product.

   The deal workspace reference has the right mental model: persistent deal header, stage context, tabs for related work, and a prominent next action. This should inform the production layout.

3. The kanban should be compact and scannable.

   Deal cards should show only the information needed to decide where attention goes next:

   - deal title.
   - company or counterparty.
   - one next action.
   - owner.
   - stale or pending approval flags.
   - last activity.

   The production kanban should use `janhesters/shadcn-kanban-board` for the interaction base, then adapt this compact information hierarchy.

4. Right-side detail panels work well for review queues.

   Routing review, VA queue, users/settings, messages, and similar list workflows should generally use list/table on the left and selected-item detail on the right. This keeps context visible while the user acts.

5. The next-action panel has the right prominence.

   The reference panel correctly makes the current action visually distinct without making the whole screen about AI. Keep the structure:

   - proposed action summary.
   - route label: System, VA, or Self.
   - confidence only when useful.
   - preview for outbound sends.
   - primary action plus edit/defer/reject/reroute controls.

6. Status language is useful when it is concrete.

   Keep badges for:

   - internal/shared visibility.
   - pending approval.
   - route: System, VA, Self.
   - classification pending.
   - confidence on routing review.
   - invited/disabled/active users.

7. Settings should preview impact before committing.

   The routing threshold preview and role capability matrix are good patterns. Production should keep the idea, but the copy and behavior must be backed by real data and permission checks.

## What Not To Copy

1. Do not copy the custom UI runtime.

   The zip uses global React components, a large custom CSS utility file, inline styles, and static mock data. Production should use the planned frontend architecture:

   - shadcn/Base UI primitives.
   - Tailwind tokens.
   - generated API client.
   - adapters.
   - domain hooks.
   - dumb components.

2. Do not copy exact layout dimensions.

   Treat sidebar widths, panel widths, column widths, spacing, and artboard sizes as mock choices. Production must be responsive and tested at desktop and mobile breakpoints.

3. Do not reintroduce cut scope.

   The reference includes hints of priority and other richer workflow surfaces. Initial CTW 2.0 should still omit advanced priority controls, autonomy, trust dashboard, notification center, and Document Studio.

4. Do not overuse AI ornamentation.

   The purple sparkle treatment is acceptable for mock clarity, but production should label work as "System", "Proposed", "Classifying", or "Draft" when possible. AI should be a provenance/status detail, not a decorative theme.

5. Do not make the login screen a brand/quote page by default.

   The split login mock is fine directionally, but CTW is an operational tool. Production login should prioritize fast sign-in and invitation acceptance. Any brand panel should be restrained and optional.

6. Do not make everything a card.

   The reference is card-heavy in places. Production should use cards for individual repeated items, panels, and settings groups, but avoid nesting cards or turning every section into a floating object.

## Production Design Direction

The production UI should feel:

- compact.
- calm.
- fast to scan.
- permission-aware.
- explicit about what will happen before high-stakes actions.
- transparent about System-proposed work without making AI the center of the interface.

Use a restrained shadcn-style visual language:

- white background.
- subtle muted section bars.
- thin borders.
- 6-8px radius.
- compact tables.
- dense but readable text.
- status colors limited to blue, green, amber, red, purple, and neutral.
- lucide icons inside controls.

## Screen-Specific Influence

### App Shell

Carry forward:

- left navigation grouped into Workspace and Settings.
- org switcher in the shell.
- active route treatment.
- user/account area at the bottom.
- scoped badges for routing review or pending approvals.

Refine:

- use capabilities rather than role strings to show navigation.
- add global search as planned.
- keep notification indicators scoped, not a full notification center.

### Deals Kanban

Carry forward:

- compact stage columns.
- deal cards with title, company, one next action, flags, owner, and last activity.
- filter bar above the board.
- clear link to routing review when relevant.

Refine:

- use `janhesters/shadcn-kanban-board`.
- make drag affordance visible only when the user can move stages.
- preserve keyboard drag/drop behavior from the imported board.

### Deal Workspace

Carry forward:

- persistent deal header.
- stage bar.
- tabs: Overview, Messages, Documents, Tasks, Participants, Activity.
- right-weighted summary panels on Overview.
- next-action panel above other work.

Refine:

- remove priority from initial scope unless later re-approved.
- ensure tabs are real routes/search params, not local-only state.
- do not render unavailable actions for unauthorized users.

### Messages And Documents

Carry forward:

- message timeline plus detail panel.
- direction/channel/visibility indicators.
- document groups by type.
- classification-in-progress state.
- upload and replacement as clearly separate actions.

Refine:

- make hide/redact distinction explicit.
- make document visibility preview mandatory before sharing.

### Routing Review

Carry forward:

- oldest-first queue.
- confidence explanation.
- candidate deal list.
- assign/find/create/unrelated actions.

Refine:

- threshold is configurable from org settings.
- action undo must preserve original queue age.
- no broker/client/VA access.

### VA Queue

Carry forward:

- same-app internal tab.
- grouped statuses.
- selected-item detail panel.
- claim/start, submit, blocked, clarification actions.

Refine:

- AM/Admin review states should be distinct from VA execution states.
- every handoff should write task outcome and audit history.

### Settings

Carry forward:

- users table plus detail panel.
- role capability matrix.
- routing threshold with impact preview.
- channels list for Resend/Twilio.

Refine:

- every permission/default change needs before/after preview.
- role defaults cannot substitute for deal-specific permission grants.
