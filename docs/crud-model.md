# CTW 2.0 CRUD Model

Working draft, May 17, 2026.

CRUD here means user-visible product behavior, not final database tables.

## General Rules

- Deletion should usually mean archive, cancel, unlink, or hide. Hard delete should be admin-only and rare.
- Every meaningful create, update, delete/archive, approval, routing decision, and outbound send writes an audit event.
- Channel-ingested messages and documents should preserve original source content even if metadata changes later.
- Permission checks apply to every mutation, including manual broker/client edits.
- The app owns all writes. AI can suggest changes, but approved app workflows apply them.

## Organization

Create:

- Admin creates an organization.

Read:

- Admin sees all organization settings.
- AMs see the organization they belong to.

Update:

- Admin updates organization name, settings, routing confidence threshold, and default permissions.

Delete/archive:

- Admin archives organization.
- Hard delete is out of scope for the initial product.

## Users and Memberships

Create:

- Admin invites AMs, brokers, clients, VAs, and other admins.
- AM can invite brokers/clients to a deal if permission allows.

Read:

- Admin sees org users and roles.
- AM sees participants on deals they manage.
- Brokers/clients see visible participants on deals they can access.

Update:

- Admin changes role, status, and org-level permissions.
- AM changes deal-level participant permissions when allowed.
- Users update their own contact and notification preferences.

Delete/archive:

- Admin deactivates users.
- AM removes a participant from a deal when allowed.

## Deals

Create:

- AM or Admin creates a deal.
- Broker/client deal creation is out of scope unless explicitly enabled later.

Read:

- AM/Admin sees assigned or permitted deals.
- Broker/client sees deals where they are participants and have view permission.
- VA sees deals only through assigned work items.

Update:

- Permitted users edit deal fields.
- Permitted users move stage.
- AM/Admin manage participants, visibility, and internal state.

Delete/archive:

- AM/Admin archives a deal.
- Broker/client cannot archive deals in the initial product.

## Deal Participants and Permissions

Create:

- AM/Admin adds broker, client, client contact, VA, or observer to a deal.

Read:

- Permitted users see visible participants.
- Internal-only participants can be hidden from brokers/clients.

Update:

- AM/Admin changes role, visibility, and deal-level capabilities.

Delete/archive:

- AM/Admin removes participant access from a deal.

## Messages

Create:

- System creates messages from inbound email/SMS/voice transcript.
- AM/System creates outbound draft messages.
- Approved outbound messages are sent and stored.
- AM can add an internal note if needed.

Read:

- AM/Admin sees deal messages according to internal visibility.
- Broker/client sees messages shared with them or messages they participated in.
- VA sees messages needed for assigned work.

Update:

- AM/Admin can reassign a message to another deal.
- AM/Admin can mark a message reviewed, internal-only, or shared.
- Original message body should not be edited except through redaction workflows.

Delete/archive:

- AM/Admin can hide, redact, or unlink a message from a deal.
- Hard delete is out of scope.

## Documents

Create:

- System creates documents from attachments.
- Permitted users upload documents.
- System creates OCR/PDF text extraction artifacts.

Read:

- Users read documents according to deal/document permissions.
- VA reads documents needed for assigned work.

Update:

- Permitted users rename, classify, tag, replace version, or move document stage/folder.
- Async classification can update document type after filing.
- AM/Admin controls document visibility.

Delete/archive:

- Permitted internal users archive documents or remove them from a deal.
- External users can remove their own uploaded document only if policy allows.

## Tasks and Next Action

Create:

- AM creates tasks manually.
- System creates one proposed next action per deal.
- Approved next action becomes a task or updates an existing task.

Read:

- AM/Admin sees deal tasks.
- Broker/client sees tasks shared with them.
- VA sees assigned tasks.

Update:

- AM edits, approves, rejects, defers, routes, or completes tasks.
- Broker/client can update shared/request tasks if permission allows.
- VA updates assigned task status and submitted work.

Delete/archive:

- AM/Admin cancels or archives tasks.
- Proposed next action can be dismissed and replaced.

## Routing Review Items

Create:

- System creates a review item when message-to-deal confidence is below the configured threshold.

Read:

- AM/Admin sees review queue.

Update:

- AM/Admin assigns the item to a deal, marks it unrelated, or creates a new deal if needed.

Delete/archive:

- Review item closes after resolution and remains in audit history.

## VA Work Items

Create:

- AM routes a task to VA.
- System creates a VA queue item from that routed task.

Read:

- VA sees assigned queue items.
- AM/Admin sees all VA work tied to their deals.

Update:

- VA marks in progress, asks for clarification, submits work, or marks blocked.
- AM accepts, rejects, or sends back for revision.

Delete/archive:

- AM/Admin cancels VA work.

## Audit Events and Outcomes

Create:

- System records audit events for key changes.
- System records task outcomes: accepted, edited, rejected, deferred, rerouted, completed.

Read:

- AM/Admin sees audit trail.
- Broker/client sees a limited activity history if allowed.

Update:

- Audit events are append-only.
- Outcome correction is admin-only and should create a new audit event.

Delete/archive:

- No user-facing delete for audit events in the initial product.
