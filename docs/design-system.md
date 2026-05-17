# CTW 2.0 Design System

## Tokens

- Font: Inter or the system sans stack.
- Mono: `ui-monospace`, SFMono-Regular, Menlo, Monaco, Consolas.
- Background: `#f8fafc`.
- Surface: `#ffffff`.
- Surface muted: `#f1f5f9`.
- Border: `#dbe3ea`.
- Text strong: `#0f172a`.
- Text body: `#334155`.
- Text muted: `#64748b`.
- Accent: `#0f766e`.
- Accent hover: `#115e59`.
- Radius: 8px for panels/cards, 6px for controls, 999px only for badges/avatars.
- Spacing: 4px scale. Dense rows use 8px vertical padding; panels use 16px.

## Status Colors

- System route: blue.
- VA route: purple.
- Self route: neutral.
- Shared visibility: green.
- Internal visibility: amber.
- Pending/review: amber.
- Error/destructive: red.
- Complete/sent: green.
- Draft/proposed: blue.

## Components

- Buttons use icon-leading labels for explicit commands and icon-only controls for familiar actions.
- Tables are compact, sticky-header capable, and never card-wrapped inside another card.
- Tabs own route/search state.
- Badges describe status, route, visibility, and confidence only when useful.
- Dialogs are reserved for destructive or high-stakes confirmation.
- Toasts confirm mutations, but the underlying object must also update in place.

## Layout Patterns

- App shell: left rail, top context bar, content surface.
- Kanban: compact columns based on `janhesters/shadcn-kanban-board`; cards show title, company, one next action, stale/pending flags, owner, and last activity.
- Workspace: persistent deal header, stage rail, tabbed body.
- Review queues: list/table left, selected item detail/action panel right.
- Settings: table or matrix plus detail/impact preview panel.

## Interaction Rules

- URL search params own filters, selected row/item, tabs, and panel state.
- Drag affordances render only when `moveDealStage` is available.
- Undo is preferred for reversible filing/routing/classification changes.
- Confirm is required for archive, redact, outbound send, disabling users, and permission changes.
- Broker/client surfaces use the same shell vocabulary but omit internal tabs and actions.
