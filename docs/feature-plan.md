# CTW 2.0 Feature Plan

Working draft, May 17, 2026.

## Product

CTW 2.0 is a CRE deal operations system. It keeps deals organized from email, SMS, voice, and documents, then helps users move each deal forward with the right amount of human review.

The deal is the center of the product. Each deal has participants, stage, messages, documents, tasks, and one current next action.

The product loop is:

1. Listen to deal activity.
2. File messages and documents into the right deal.
3. Update deal state.
4. Show one next action.
5. Execute or route the work.
6. Capture what happened.

## Main Product Decisions

1. Deals are the top-level object.
2. AMs use the main dashboard.
3. Brokers and clients can log in, but channels remain their primary interaction model.
4. Brokers and clients can see kanban/status and make manual changes when permissions allow it.
5. Permissions are capability-based, not just hardcoded by role.
6. Message-to-deal routing is app-owned and must happen fast.
7. The confidence threshold for avoiding the routing review queue is configurable.
8. Common document type classification happens asynchronously after filing.
9. The kanban shows one next action per deal.
10. VA work lives inside the same app as an internal tab.
11. The initial build ships audit trail and approval history, not a full trust dashboard.

## Users and Permissions

### Roles

AM:

- Primary operator.
- Manages deals, participants, tasks, approvals, and routing.
- Can approve outbound communication.

Broker:

- External authenticated user.
- Primarily sends instructions through email, SMS, and voice.
- Can log in to view kanban/status and make permitted manual changes.

Client:

- External authenticated user.
- Primarily participates through email, SMS, and voice.
- Can log in to view shared deal status, documents, and permitted requests.

VA:

- Internal worker.
- Uses an internal tab in the same app.
- Handles assigned verification or work items.

Admin:

- Manages organizations, users, permissions, configuration, and system settings.

### Permission Model

Permissions are attached to a user, role, organization, and deal. Roles provide defaults, but individual deals can override them.

Core capabilities:

- View deal.
- View kanban.
- View messages.
- View documents.
- Upload documents.
- Edit deal fields.
- Move deal stage.
- Create task.
- Edit task.
- Complete assigned task.
- Approve proposed action.
- Approve outbound send.
- Route work to System, VA, or Self.
- Manage participants.
- Manage permissions.
- Manage organization settings.

Initial permission defaults:

| Capability | AM | Broker | Client | VA | Admin |
| --- | --- | --- | --- | --- | --- |
| View assigned deal | Yes | If participant | If participant/shared | If assigned | Yes |
| View kanban | Yes | If allowed | If allowed | Internal queue only | Yes |
| Edit deal fields | Yes | If allowed | If allowed | No | Yes |
| Move stage | Yes | If allowed | Usually no | No | Yes |
| Upload documents | Yes | If allowed | If allowed | If assigned | Yes |
| Create/edit tasks | Yes | Limited/request-only | Limited/request-only | Assigned items only | Yes |
| Approve outbound send | Yes | No | No | No | Yes |
| Route work | Yes | No | No | No | Yes |
| Manage permissions | Limited | No | No | No | Yes |

Product note:

Broker/client login should feel like a lightweight deal portal, not a second AM dashboard. The main product behavior should still work if they never log in and only use email/SMS/voice.

## CRUD Model

The detailed CRUD plan lives in [crud-model.md](crud-model.md). The feature plan only needs the product-level decisions:

- Core objects: organizations, users/memberships, deals, participants/permissions, messages, documents, tasks/next actions, routing review items, VA work items, audit events, and outcomes.
- Deletion usually means archive, cancel, unlink, or hide. Hard delete is admin-only and rare.
- Every meaningful mutation writes an audit event.
- Permission checks apply to every mutation, including broker/client manual edits.
- The app owns all writes. AI can suggest changes, but approved app workflows apply them.

## AI Boundary

The important split is whether a feature sits in the critical path.

App-owned:

- Source-of-truth deal state.
- Permissions.
- Fast message-to-deal routing.
- Configurable routing confidence thresholds.
- Approval workflows.
- Document storage and filing.
- OCR/PDF extraction.
- Audit logs.
- Task status.
- VA queue.

AI-assisted:

- Summarize messy context.
- Extract deal facts from messages and documents.
- Classify document type after filing.
- Recommend stage changes.
- Recommend the one next action.
- Draft messages or task payloads.
- Explain why something is recommended.
- Help with low-confidence routing review.

Rule:

AI should not sit in the hot path for core ingestion. The app places the message or document somewhere stable first. AI can enrich it afterward.

## Initial Rebuild Scope

This is the lean version. Build these first.

### 1. Accounts, Roles, and Permissions

Ship:

- AM login.
- Broker login.
- Client login.
- VA/admin login.
- Organization model.
- User invitations.
- Deal participants.
- Capability-based permissions.
- Deal-level permission overrides.

Acceptance test:

An AM creates a deal, adds a broker and client, controls what each can see or edit, and verifies that each role sees the correct surface after login.

### 2. Deal Kanban and Deal Workspace

Ship:

- Deal kanban by CRE stage.
- AM kanban/status view.
- Broker/client kanban/status view, permission-limited.
- Deal detail page.
- Participants tab.
- Messages tab.
- Documents tab.
- Tasks/next action tab.
- Manual deal edits.
- Manual stage movement when permitted.
- Audit trail for manual changes.

Acceptance test:

An AM, broker, and client can each log in and see the same deal through their allowed permissions. A permitted user can manually adjust the deal, and the change is visible in the audit trail.

### 3. Channel Ingestion and Filing

Ship:

- Email ingestion.
- SMS ingestion.
- Contact resolution.
- Thread matching.
- Fast message-to-deal routing.
- Configurable routing confidence threshold.
- Review queue for low-confidence routing.
- Passive observation mode.
- Attachment capture.
- Durable document storage.
- OCR/PDF text extraction.
- Async document type classification after filing.
- Message and document timeline.

Acceptance test:

An inbound email with an attachment is received, matched to the correct deal, shown in the timeline, and filed under documents. If confidence is below the configured threshold, it appears in the review queue.

### 4. One Next Action

Ship:

- One primary next action per deal.
- Next action shown on the kanban card and deal detail page.
- AM controls: approve, edit, reject, defer.
- Stage change recommendations.
- Simple stale-deal flag.
- Simple priority/manual sort.

Acceptance test:

An inbound message like "LOI attached" is filed to the deal. CTW recommends the next action and, if relevant, a stage change. The AM approves or edits it, and the deal updates.

### 5. Work Execution

Ship:

- Executor choices: System, VA, Self.
- System draft flow.
- VA tab inside the same app.
- Self-completion flow.
- AM approval before outbound email/SMS.
- Task status.
- Outcome capture.
- Audit trail.

Acceptance test:

CTW proposes "send LOI response." The AM assigns it to System, reviews the draft, approves the outbound message, and the outcome is logged. If assigned to VA, the work appears in the VA tab and returns to AM approval.

## Cut From Initial Rebuild

These are the cuts that make the plan less complicated.

Cut for now:

- Full trust dashboard.
- Prediction accuracy stats.
- Advanced priority scoring.
- Secondary next-action suggestions on the kanban.
- Live voice workflows beyond transcripts.
- Slack notifications.
- Rich in-app Document Studio editor.
- External developer API/tooling surface.
- Cross-org analytics.
- Self-hosted model optionality.
- Advanced model training platform.
- Complex capacity or escalation engines.
- Full CTW 1.0 feature parity.

Keep the data hooks:

- Outcome capture.
- Audit trail.
- AM edits.
- Accepted/rejected/deferred/rerouted status.
- Configurable routing thresholds.

Reason:

These hooks preserve future analytics without forcing the first rebuild to solve dashboards, scoring, and reporting all at once.

## Later Roadmap

Consider after the initial rebuild is working:

- Trust dashboard, if audit history is not enough.
- Better priority scoring.
- Voice workflows beyond transcripts.
- Broker/client request workflows.
- Document Studio.
- Slack or other notification surfaces.
- External API/tooling surface.
 