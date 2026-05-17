# CTW 2.0 Design Philosophy

CTW is an operations console for commercial real estate deal work. It should feel calm, dense, trustworthy, and fast to scan. The interface is not a marketing site and it is not an AI showcase. The product center is always the deal, with channel activity, documents, tasks, approvals, and participants arranged around it.

## Product Feel

- Operational, not decorative.
- Compact, but not cramped.
- Explicit about permissions and consequences.
- Clear about what is System-proposed versus user-confirmed.
- Built for repeated daily use by AMs, admins, VAs, brokers, and clients.

## Design Principles

1. Deals come first. Every screen should make the active deal, queue item, or deal card obvious.
2. One next action. Do not show competing suggestion lists in the initial product.
3. Hide unavailable actions. Permission-limited users should see a coherent surface, not disabled clutter.
4. Make risky actions previewable. Sending, redacting, archiving, role changes, and routing threshold changes show the impact before commit.
5. Favor list/detail workflows. Review queues, settings, users, messages, and VA work should preserve list context while details are open.
6. Feedback is local. Mutations update in place and use concise confirmations.

## What To Avoid

- Landing-page composition inside the app.
- Purple AI ornamentation as a dominant visual language.
- Nested cards and oversized empty panels.
- Hidden state in local component state when the URL should own it.
- Role strings in UI logic when capabilities are available.

## Directional Reference

Use `docs/design-reference-notes.md` as a directional reference only. Keep the dense shell, compact kanban, right-side review panels, concrete badges, and settings impact previews. Do not copy its code, global components, exact dimensions, or static data model.
