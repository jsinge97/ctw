# CTW 2.0 Agent Instructions

## Source of Truth

Read these before coding, and re-read the relevant sections before each task:

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

## Execution Rules

- Commit after each completed task.
- After each milestone, request subagent review before moving on.
- Use no more than five subagent review passes per milestone.
- Keep commits scoped to the task; do not batch unrelated work.
- Do not revert user changes.
- Do not edit generated OpenAPI/client files by hand.
- Regenerate generated files with the commands in `CLAUDE.md`.
- For Resend testing, set `RESEND_API_KEY` in the shell and run `pnpm resend:smoke`; never commit the real key.

## Product Rules

- Deals are the top-level object.
- One next action per deal.
- Brokers and clients can log in, but channels remain their primary workflow.
- Permissions are capability-based.
- VA work lives inside the same app as an internal surface.
- No autonomy/trust-dashboard features in this phase.

## Safety Rules

- Production must not run demo bearer tokens, memory workflow, or fake providers.
- Every meaningful mutation writes audit history.
- App workflows own writes.
- AI/provider work can create typed proposed records or drafts, but must not directly apply arbitrary writes.
- Use Prisma for durable persistence.
- Do not leak cross-organization data.
