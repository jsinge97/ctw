# CTW 2.0 Screens and Information Hierarchy

Working draft, May 17, 2026.

This doc describes what each screen in the web app shows, in what order of importance, and how the screens connect. It is a product-level information map, not a visual design spec.

Related docs:

- [feature-plan.md](feature-plan.md)
- [crud-model.md](crud-model.md)
- [data-model.md](data-model.md)
- [architecture.md](architecture.md)

## Hierarchy Principles

1. The deal is the center of every screen.
2. Each screen has one primary job. Secondary information supports that job; it does not compete with it.
3. Show one next action per deal, never a list of suggestions.
4. Permission-limited views hide what the user cannot act on, rather than disabling it in place.
5. URL search params are the source of truth for filters, selected deal, active tab, and panel state.
6. Broker/client surfaces feel like a lightweight portal, not a second AM dashboard.
7. AI-suggested content is always clearly labeled as proposed, not as fact.

### Interaction Principles

These shape how every screen communicates with the user. They derive from Don Norman's interaction model and apply across surfaces.

1. **Signifiers over recall.** If a row is draggable, clickable, expandable, or editable, the interface must show it before the user touches it. Hover states are not enough.
2. **Feedback after every state change.** Every mutation produces visible confirmation in the same viewport: the changed object updates in place, a toast confirms the change, or both. The user must never have to refresh or navigate to verify that a change worked.
3. **Reversible by default, confirm only when not.** Most actions (assign, file, classify, reroute) should be reversible through a brief undo. Only destructive or hard-to-reverse actions (archive, redact, send outbound, disable user) require a confirmation step.
4. **Labels match user vocabulary, not implementation.** "File to deal" instead of "set deal_id." "Send back to VA" instead of "transition status to in_progress." If a label requires staff training to understand, rename it.
5. **Predictability before action.** High-stakes controls (approve outbound, change role defaults, change routing threshold) must show what will happen before the user commits — recipients, draft preview, impact count, list of affected items.
6. **Recognition over recall.** Users should see recent deals, recent contacts, suggested matches, and saved filters rather than typing them in. Search is a fallback, not the primary path.

## Top-Level Surfaces

These are the entry points users land on after login. The role and permissions decide which surfaces are visible.

| Surface | Route | Primary audience |
| --- | --- | --- |
| Deals (kanban) | `/deals` | AM, Admin, Broker, Client |
| Deal workspace | `/deals/$dealId` | AM, Admin, Broker, Client |
| Routing review | `/routing-review` | AM, Admin |
| VA queue | `/va` | VA, AM (read), Admin |
| Settings: Users | `/settings/users` | AM (limited), Admin |
| Settings: Organization | `/settings/organization` | Admin |
| Login | `/login` | Everyone |

Index route `/` redirects based on role:

- AM/Admin → `/deals`
- Broker/Client → `/deals` (permission-limited view)
- VA → `/va`

## App Shell

Persistent across all authenticated screens.

Primary content:

- Left rail or top nav with the surfaces above, filtered by role and capability.
- Active surface label.
- Global search entry point (deals, contacts, documents).

Secondary content:

- Organization switcher (only if the user has memberships in more than one org).
- Current user menu: profile, notifications, sign out.
- Notification indicator for routing review backlog and pending approvals (AM/Admin only).

Actions:

- Navigate between surfaces.
- Open global search.
- Sign out.

Notes:

- Brokers/clients do not see routing review, VA queue, or org settings entries.
- The shell does not show counts that would leak hidden state (e.g., never show "12 deals" if the viewer can only see 3).

Feedback and signifiers:

- The notification indicator shows a count *and* a short label of what's new ("3 messages to review"). A bare red dot fails the gulf of evaluation.
- Clicking the indicator opens a scoped list, not just the surface. The user should land on the new items, not a page that may or may not contain them.
- Organization switcher renders as a switcher only when more than one org exists; otherwise the name is plain text. A disabled-looking dropdown invites wrong-click.

## Login `/login`

Primary content:

- Email or SSO sign-in form.
- Branding.

Secondary content:

- Invitation-acceptance flow when arriving from an emailed invite link.

Actions:

- Sign in.
- Request access (out of scope for initial product, link to support).

Feedback:

- Submit shows progress in place on the button, not a navigation away.
- Failed sign-in returns a specific error (invalid credentials, account disabled, invitation expired) rather than a generic "failed."
- Successful sign-in routes the user to their role's home; the redirect target is visible in the URL before the page renders to avoid a blank-screen pause.

## Deals Kanban `/deals`

The home for AM/Admin. Brokers and clients see a permission-limited version of the same screen.

Primary content:

- Columns by deal stage: prospect, loi, negotiation, diligence, close, closed_won, lost.
- Deal cards within each column, sorted by priority then last activity.

Each deal card shows, in order:

1. Deal title.
2. Primary company name.
3. One next action label.
4. Stale flag if applicable.
5. Last activity timestamp.
6. Owner AM avatar.

Secondary content:

- Filter bar: owner, stage, participant company, has-stale-flag, has-pending-approval.
- Search box scoped to deals.
- Counts per column (AM/Admin only; brokers/clients see only what they can access).

Actions:

- Open a deal (navigates to `/deals/$dealId`).
- Move a deal between stages by drag, when the user has `Move stage` capability.
- Create a new deal (AM/Admin only).
- Adjust filters (state lives in URL search params).

Links out:

- Deal card click → `/deals/$dealId`.
- "Needs review" badge → `/routing-review`.

Permission-limited views:

- Broker/client only sees columns and cards for deals they participate in with `View deal` capability.
- Drag-to-move is hidden if the viewer lacks stage-change capability for that deal.
- AI-recommended stage changes appear only to users with approve-stage capability.

Signifiers and feedback:

- Cards show a drag handle on hover and a grab cursor when the viewer can move the deal. Cards without that capability render with no handle, no grab cursor, no movement on drag attempt.
- During drag, valid drop columns highlight; invalid stage transitions (per `canTransitionDealStage`) dim and reject the drop with an inline reason.
- Dropping a card optimistically moves it, writes the audit event, and shows a short undo affordance ("Moved to LOI. Undo") for ~6 seconds.
- The next action label on each card uses the same verb form everywhere ("Send LOI response," "Request estoppel") so users learn the pattern.

## Deal Workspace `/deals/$dealId`

The deal shell. Holds tabbed views and a persistent header.

### Deal Header

Primary content:

1. Deal title.
2. Stage indicator with current stage highlighted.
3. One next action panel: title, recommended route (System/VA/Self), AI rationale, and approve/edit/reject/defer/route controls. AM/Admin only; brokers/clients see a read-only summary if shared.
4. Primary company.
5. Owner AM.

Secondary content:

- Status: active, archived, closed.
- Stale flag.
- Last inbound/outbound activity timestamps.
- Priority rank (manual).

Actions:

- Approve, edit, reject, defer, or reroute the next action.
- Move stage (if permitted).
- Edit deal fields inline (if permitted).
- Archive deal (AM/Admin).

Next-action control hierarchy:

- Five sibling buttons (approve/edit/reject/defer/route) is too many choices for the highest-frequency control on the page. Render one primary action (Approve) plus a secondary group (Edit, Defer) and put Reject/Reroute behind an overflow menu.
- Approve is irreversible *in effect* (it executes work or schedules a send), so it must show the action's payload preview before committing. For System drafts this means inline draft + recipient list; for stage changes this means before/after stage labels.
- Defer requires a duration ("1 day," "until reply," custom). Indefinite deferral creates dead-end tasks.
- Reroute names the new executor and any notification it will trigger ("Routes to VA, notifies Maria") before committing.

### Tabs

Tabs persist across the workspace; the active tab lives in the URL.

- Overview (default landing tab)
- Messages → `/deals/$dealId/messages`
- Documents → `/deals/$dealId/documents`
- Tasks → `/deals/$dealId/tasks`
- Participants → `/deals/$dealId/participants`
- Activity (audit/approval history) → `/deals/$dealId/activity`

#### Overview Tab

Primary content:

- Next action panel (echoed from header for context, with full rationale and history).
- Recent activity strip: last 3 messages, last document, last task outcome.
- Deal facts panel: extracted/edited fields like price, sqft, address, parties.

Secondary content:

- Stage history.
- Participants summary with avatars.
- Pending approvals count (links to relevant items).

Actions:

- Same controls as the header for the next action.
- Edit deal facts (permitted users).
- Jump to any other tab.

#### Messages Tab `/deals/$dealId/messages`

Primary content:

- Chronological timeline of messages (email, SMS, voice transcript, internal note, outbound).
- Each row: direction icon, channel, participants, subject or first line, timestamp, attachment chip count, visibility chip (internal/shared).

Secondary content:

- Filter: channel, direction, participant, has-attachments, internal-only.
- Detail panel (in URL search param) showing full message body, recipients, raw source link, and link to source documents.
- Routing confidence badge if the message arrived through low-confidence routing.

Actions:

- Open message detail.
- Reassign message to another deal (AM/Admin).
- Mark internal-only or shared (AM/Admin).
- Compose internal note.
- Hide or redact (AM/Admin, audited).

Permission notes:

- Brokers/clients only see messages they participated in or that are explicitly shared.
- Internal notes never appear to external participants.

Signifiers and feedback:

- Internal-only messages have a persistent visual treatment (background tint + label) that is identical everywhere in the app, so internal context never gets mistaken for outbound content. The same treatment appears on the compose box for internal notes.
- Reassigning a message to a different deal is high-stakes and slip-prone. Require a confirm step with the destination deal title and a 10-second undo after commit. Both the source and destination deals record the move in their audit feeds.
- Hide and Redact are different actions with different consequences; do not collapse them into a generic "delete." Hide removes a message from a deal view; Redact also overwrites the body. Each shows a preview of what external participants will see afterward.
- Routing-confidence badges link to the original routing review item so the user can see why the system chose this deal.

#### Documents Tab `/deals/$dealId/documents`

Primary content:

- Flat document list.
- Each row: title, type, classification status, latest version, visibility, tags, and row actions.

Secondary content:

- Filter: type, tag, visibility, uploader.
- Metadata edit modal opened from the row actions.
- Future detail view may include version history, source message link, extracted text preview, and OCR status.
- Dropzone upload area with per-file progress, success, and error state (permitted users only).

Actions:

- Upload new document (permitted users).
- Replace/version an existing document.
- Edit metadata from row actions: rename, classify, tag, change visibility.
- Archive document.

Permission notes:

- Brokers/clients see only documents with `shared_with_deal_participants` visibility plus what they uploaded themselves.
- Async classification updates appear inline; do not require a refresh.

Signifiers and feedback:

- "Upload new document" and "Replace this version" are separate controls with separate placements: upload at the top of the list, replace inside the document detail panel. A single ambiguous upload zone causes users to silently create duplicates.
- Pending classification renders as a labeled progress state ("Classifying…"), not a static badge. When it resolves, the row animates the new type briefly so the user notices the change.
- Visibility changes preview who will gain or lose access ("Sharing will grant access to 2 brokers, 1 client") before committing.
- Drag-to-upload highlights a clear drop zone and rejects unsupported types inline rather than failing after upload completes.

#### Tasks Tab `/deals/$dealId/tasks`

Primary content:

- The one current next action, pinned at the top, with full payload preview (e.g., draft message body if route = System).
- List of other tasks below, grouped by status: in progress, waiting approval, proposed, deferred, completed, rejected, canceled.

Each task row shows: title, route badge (System/VA/Self), assignee, due-at, status, source message link if any.

Secondary content:

- Filter: route, assignee, status.
- Detail panel for any task with payload, history, outcomes, approval events.

Actions:

- Approve, edit, reject, defer, reroute next action.
- Create manual task (permitted users).
- Complete assigned task (assignee).
- Approve outbound send (AM with capability).

Permission notes:

- Brokers/clients see only tasks shared with them or that they were assigned.
- The next-action approval controls render only for users with the matching capability.

Signifiers and feedback:

- Approve outbound send is the highest-stakes action in the product. It opens a final-review modal showing the full draft, all recipients (resolved to names + addresses), the channel, and the source deal. Sending happens only from inside that modal.
- The modal includes an "Edit before sending" path that returns the user to the draft, not just a Send/Cancel pair.
- After send, the task row updates to "Sent" in place, the message appears in the Messages tab, and a toast confirms with a link to the sent message.
- Reject and Defer ask for a short reason that becomes part of the task's outcome record. This matches the user mental model that "I rejected this because…" and gives later analytics something to work with.

#### Participants Tab `/deals/$dealId/participants`

Primary content:

- Participant list grouped by role: AM, broker, client, client contact, VA, observer.
- Each row: name, company, role on this deal, visibility (internal/shared), capability summary, login status.

Secondary content:

- Detail panel for editing a single participant's capabilities and visibility.
- Pending invitations.

Actions:

- Add participant (membership, contact, or company).
- Edit per-deal capability overrides (permitted users).
- Remove participant.
- Resend invitation.

Permission notes:

- Internal-only participants are hidden from broker/client views.
- Brokers/clients see a simplified roster: who is on the deal and their role, no capability details.

Signifiers and feedback:

- Capability edits show a before/after preview ("Broker will gain Edit deal fields and Move stage") before save. Bare checkboxes hide the impact.
- Removing a participant shows what they will lose access to (counts: messages, documents, tasks) and offers a 10-second undo after commit.
- Pending invitations show the invitation age and a resend control; expired invitations are visually distinct from active ones.

#### Activity Tab `/deals/$dealId/activity`

Primary content:

- Combined feed of audit events and approval events, newest first.
- Each row: actor, action type, summary, timestamp.

Secondary content:

- Filter: actor, event type, date range.
- Detail panel for individual event diffs and decision reasons.

Actions:

- Read only. No mutation from this tab.

Permission notes:

- Broker/client activity view is derived from events with `external_activity` visibility, not raw audit data.

## Routing Review `/routing-review`

For AM/Admin. The queue of inbound messages below the routing confidence threshold.

Primary content:

- Queue list, oldest-first by default, with: inbound channel, sender, subject or first line, suggested deal, confidence score, age in queue.

Secondary content:

- Filter: channel, age, confidence band, sender.
- Detail panel: full message body, attachment previews, suggested deal context, alternate deal candidates.
- Threshold indicator (read from organization config).

Actions:

- Assign to a suggested deal.
- Search and assign to any deal.
- Mark unrelated (no deal).
- Create a new deal from this message.
- Bulk assign when sender + thread match the same deal.

Links out:

- Resolved item → opens the destination deal in `/deals/$dealId`.

Permission notes:

- Brokers, clients, and VAs do not see this surface.

Signifiers and feedback:

- Confidence score is shown with a short, plain-language explanation on hover ("Matched sender to 2 deals; subject mentions neither") rather than a bare number. The number alone fails the gulf of evaluation.
- "Mark unrelated" and "Create new deal" are reversible within a short window — the item returns to the queue from an undo affordance, and resolved-then-undone items keep their original age so they do not appear newly arrived.
- After assignment the queue item disappears and a toast confirms with a link to the destination deal, so the user can verify routing without searching.
- Bulk assign previews the affected count and the destination deal title before commit; bulk actions are not silently applied on selection.

## VA Queue `/va`

Internal tab for VA work. AM/Admin can read it; VAs work from it.

Primary content:

- Queue grouped by status: queued, in progress, blocked, submitted, sent back.
- Each row: task title, deal, instructions preview, due-at, assigned VA, age.

Secondary content:

- Filter: assignee, deal, status, age.
- Detail panel: instructions, source task, related deal, attached documents, submission form.

Actions (VA):

- Claim work item.
- Mark in progress.
- Ask for clarification (creates internal note on the task).
- Submit work.
- Mark blocked.

Actions (AM/Admin):

- Accept submission.
- Send back for revision with notes.
- Cancel VA work.

Links out:

- VA item → source task on the deal workspace.

Permission notes:

- VAs only see items assigned to them or open in their queue. They do not see the broader deal kanban.
- Brokers and clients never see this surface.

Signifiers and feedback:

- "Send back for revision" requires a short reason that becomes part of the work item history. Sending back without a reason produces dead-end loops where the VA cannot tell what to change.
- The VA submission form shows a preview of what the AM will see on review, so the VA can self-check.
- Blocked items render with a visible blocked label and the blocking reason, so an AM scanning the queue can act without opening every row.

## Settings: Users `/settings/users`

For AM (limited) and Admin.

Primary content:

- User list with: name, email, role, status, last login, organization membership.

Secondary content:

- Filter: role, status.
- Detail panel: role assignment, organization-level capability overrides, invitation status.

Actions:

- Invite user (role: AM, broker, client, VA, admin).
- Change role (Admin).
- Disable/reactivate user (Admin).
- Resend invitation.

Permission notes:

- AMs can invite brokers/clients to deals they own; full user management is admin-only.

Signifiers and feedback:

- Disabling a user shows what they will lose access to (count of deals they participate in) and requires a confirm step. Disabled users render distinctly in the list, not as plain text rows.
- Role changes preview the resulting capability delta ("Will gain: Approve outbound send. Will lose: nothing.") before save.
- Invitations show a clear expiration and a single resend control; multiple pending invites for the same email are surfaced as a conflict, not silently allowed.

## Settings: Organization `/settings/organization`

Admin only.

Primary content:

- Organization profile: name, slug, status, default timezone.
- Routing confidence threshold control.
- Default permission matrix per role.

Secondary content:

- Channel configuration: connected email addresses, SMS numbers, voice numbers; engagement mode per channel.
- Notification defaults.
- Archive/restore organization.

Actions:

- Edit org profile.
- Adjust routing confidence threshold.
- Edit role defaults (with confirmation, since this affects every deal).
- Add or disable channels.

Signifiers and feedback:

- The routing threshold control shows a live impact preview ("At 0.75, ~12 messages from the last 7 days would have entered review instead of routing.") so admins can make an informed change. A bare slider without consequence preview invites blind tuning.
- Role-default edits show the affected user count and a capability diff before commit. Changes are auditable and reversible from the audit feed.
- Disabling a channel warns about in-flight messages and pending outbound drafts tied to that channel.

## Cross-Cutting Patterns

### Detail Panels

Detail panels (message detail, document detail, task detail, participant detail, activity detail) live in URL search params, not in hidden component state. This means they survive refresh, deep-linking, and back/forward navigation.

### Empty States

Every list surface needs an empty state that explains:

- What this surface is for.
- What the user can do to populate it (when actionable).
- A link to the most likely next step.

### Permission-Aware Rendering

- Hide actions the user cannot perform rather than disabling them, unless disabling explains an important constraint (e.g., "Approve" disabled until a draft exists).
- Never reveal hidden resources through counts, filter options, or error messages.
- Frontend capability checks are hints; the backend remains authoritative.

### AI-Labeled Content

- Proposed next actions, recommended stage changes, drafted messages, and async document classifications all carry a "proposed" or "auto-classified" marker until a user accepts them.
- Show the AI rationale on demand, not by default.
- Do not let AI suggestions look indistinguishable from user-entered facts.

### Audit and Approval Surfaces

- Every mutation is reflected in the deal's Activity tab.
- Pending approvals surface on: deal header, kanban card badge, app shell notification.
- Approval decisions record actor and reason; both are visible on the activity feed.

### Feedback Patterns

Every action falls into one of three feedback patterns. Pick the lightest one that closes the gulf of evaluation.

- **In-place update.** The mutated object updates immediately in the same viewport (kanban card moves columns, classification badge changes, task row shifts groups). Use for high-frequency, low-risk actions.
- **In-place update + toast.** Same as above, plus a brief toast confirming the action with a link back to the object. Use when the user might scroll away or when the change is offscreen-adjacent.
- **Confirmation modal with preview.** Show the consequence before committing. Use for irreversible or high-stakes actions: outbound send, role-default change, routing-threshold change, user disable, redact.

Failure feedback follows the same rule: errors appear in the same viewport as the action, name what failed, and offer the next step (retry, edit, contact support).

### Undo and Reversibility

- Reversible actions (file message to deal, classify document, assign routing item, move stage, change visibility, remove participant) show a 10-second undo affordance after the action commits.
- Undo restores the prior state and writes a new audit event ("Undid: moved deal to LOI"). It does not silently rewrite history.
- Actions that cannot be undone (outbound send, redact, archive org, disable user) replace the undo affordance with a pre-commit confirm.
- The undo affordance lives next to the action site, not in a global notification tray. Users should not have to chase their own actions across the screen.

### Confirmation Policy

Confirm only when the action is one of:

- Irreversible in effect (outbound send, redact body).
- Visible externally (approve send, share document with broker/client).
- Affects more than one object (bulk routing assign, change role defaults).
- Disables access (remove participant, disable user, archive org).

Otherwise rely on undo. Habit-forming confirmations train users to click through them.

Every confirmation shows: the object's identifying label, the consequence in plain language, the affected count when relevant, and an explicit verb on the primary button ("Send to broker," not "OK").

### Loading and Progress

- Initial page loads use skeleton states that match the final layout, so the screen does not visibly reflow on data arrival.
- Mutations are optimistic by default; the UI assumes success and reconciles if the server disagrees.
- Async work (document classification, OCR, AI rationale generation) shows a labeled progress state on the affected row, not a global spinner. The user should always know *what* is loading, not just *that* something is.
- Operations that exceed Doherty's ~400ms threshold without progress signal cause users to assume the click did nothing and retry.

### Recognition Over Recall

- Search inputs show recent and suggested results before the user types.
- The "assign to deal" picker in routing review surfaces the suggested deal at the top, with reason text.
- Filter chips remember the last applied set per surface (stored in URL search params).
- Compose-message and create-task flows pre-populate with deal context (participants, prior thread, suggested subject) so the user edits rather than types from scratch.

### Drag Affordances

- Draggable items show a grab cursor on hover and a drag handle when the viewer has the relevant capability. Capability-less viewers see neither.
- Valid drop targets highlight during drag; invalid targets dim and reject with an inline reason on attempted drop.
- Keyboard equivalents exist for every drag-driven action (move stage from a dropdown, reorder from arrow keys). Drag is a shortcut, not the only path.

### Labeling Discipline

- Use the user's verb, not the system's verb. "File to deal" not "set deal_id." "Send back" not "transition status." "Share with broker" not "change visibility."
- Stage names match CRE convention (prospect, LOI, negotiation, diligence, close, closed/won, lost) — never internal IDs.
- "Internal" and "shared" appear with the same wording everywhere they are used.
- Avoid status labels that require context to interpret ("pending," "open," "review_required"). Prefer phrases that name the next actor ("Waiting on AM approval," "Needs routing decision").

## Screens Cut From Initial Product

These are intentionally not built in the initial rebuild. Listed here so they do not creep in by accident.

- Trust dashboard.
- Prediction accuracy stats.
- Advanced priority scoring controls.
- Document Studio editor.
- Cross-org analytics screens.
- Notification center (beyond the shell indicator).
- Broker/client request workflow screen.
- External developer/API console.

## Open Screen Questions

1. Should the Overview tab and the deal header next-action panel be merged into one surface, or stay duplicated for context?
2. Does the routing review queue need a bulk-action mode in v1, or is single-item review enough?
3. Should the VA queue be a top-level surface for AMs, or only accessed through the deal workspace?
4. Do brokers/clients need a dedicated "shared with me" landing screen, or is the permission-limited `/deals` enough?
5. What is the standard undo window — 6, 10, 15 seconds — and does it differ by action class?
6. For stage drag-and-drop, do we confirm on stage *regressions* (moving backward) or rely on undo for those too?
7. Outbound send confirmation: is the in-modal "Edit before sending" path enough, or do we need a draft-review queue that batches outbound sends for end-of-session review?
8. Should the "proposed" AI label fade away after a user has accepted that AI's suggestions N times for a given task type, or stay permanent for trust?
