# CTW 2.0 Data Model Plan

Working draft, May 17, 2026.

This is a product data model, not a final migration file. It names the core entities, relationships, permissions, and state that the initial rebuild needs.

## Modeling Principles

1. The deal is the center of the product.
2. Every user-visible object belongs to an organization.
3. External people can exist before they have logins.
4. Login identity and deal participation are separate concepts.
5. Permissions are capability-based and can be overridden per deal.
6. Messages and documents preserve original source content.
7. Deletion usually means archive, cancel, hide, unlink, or redact.
8. Every meaningful mutation writes an audit event.
9. AI can suggest changes, but app workflows own writes.
10. Keep the initial schema boring. Add analytics or autonomy tables later only after the core workflow works.

## Entity Map

Core entities:

- `organizations`
- `users`
- `organization_memberships`
- `contacts`
- `companies`
- `deals`
- `deal_participants`
- `permission_grants`
- `channels`
- `messages`
- `message_participants`
- `documents`
- `document_versions`
- `tasks`
- `routing_review_items`
- `va_work_items`
- `approval_events`
- `audit_events`
- `task_outcomes`

Supporting enums should generally live in code first, then become lookup tables only if users need to configure them.

## Identity and Access

### `organizations`

Tenant root. Usually a brokerage/customer firm.

Important fields:

- `id`
- `name`
- `slug`
- `status`: active, archived
- `routing_confidence_threshold`
- `default_timezone`
- `created_at`
- `updated_at`
- `archived_at`

Relationships:

- Has many memberships, contacts, companies, deals, channels, permission grants.

Notes:

- Keep org settings minimal at first.
- `routing_confidence_threshold` belongs here because the user already decided it should be configurable.

### `users`

Authenticated login identity.

Important fields:

- `id`
- `auth_provider`
- `auth_subject`
- `email`
- `phone`
- `display_name`
- `avatar_url`
- `status`: active, invited, disabled
- `last_login_at`
- `notification_preferences`
- `created_at`
- `updated_at`

Relationships:

- Has many organization memberships.
- Can be linked to one or more contacts.

Notes:

- A user is not automatically an AM, broker, client, or VA. That comes from membership and deal participation.
- External brokers/clients can have user accounts, but they still primarily interact through channels.

### `organization_memberships`

A user's relationship to an organization.

Important fields:

- `id`
- `organization_id`
- `user_id`
- `role`: admin, am, va, broker, client
- `status`: invited, active, disabled
- `created_at`
- `updated_at`

Relationships:

- Belongs to organization and user.
- Can appear as a deal participant.

Notes:

- Role gives defaults. Capabilities decide actual behavior.
- A broker/client with login should have a membership.
- Keep role defaults in code for the initial product. Use `permission_grants` only for explicit overrides.

### `contacts`

People known to the organization, including people without logins.

Important fields:

- `id`
- `organization_id`
- `user_id`: nullable
- `company_id`: nullable
- `contact_type`: broker, client_contact, internal, other
- `name`
- `email`
- `phone`
- `notification_preferences`
- `status`: active, archived
- `created_at`
- `updated_at`

Relationships:

- Belongs to organization.
- Optionally belongs to a user.
- Optionally belongs to a company.
- Can appear on messages and deal participants.

Notes:

- This lets the system route inbound email/SMS from people who have never logged in.
- If a contact later creates a login, attach `user_id` instead of replacing the contact.

### `companies`

Client companies, landlords, tenants, buyer/seller entities, or other organizations participating in deals.

Important fields:

- `id`
- `organization_id`
- `name`
- `company_type`: client, landlord, tenant, buyer, seller, brokerage, other
- `status`: active, archived
- `created_at`
- `updated_at`

Relationships:

- Has many contacts.
- Can be linked to deals.

## Deals

### `deals`

Top-level work object and kanban card.

Important fields:

- `id`
- `organization_id`
- `title`
- `stage`: prospect, loi, negotiation, diligence, close, closed_won, lost
- `status`: active, archived, closed
- `primary_company_id`: nullable
- `owner_membership_id`: AM owner
- `priority_rank`: nullable manual/simple sort
- `stale_flag`
- `last_inbound_at`
- `last_outbound_at`
- `last_activity_at`
- `created_at`
- `updated_at`
- `archived_at`

Relationships:

- Belongs to organization.
- Has many participants, messages, documents, tasks, audit events.

Notes:

- Keep `priority_rank` simple for now. Advanced scoring is cut from the initial rebuild.
- Store current stage on the deal. Stage changes also create audit events.
- For the initial product, `stage` should represent the pipeline position. Use `status` for lifecycle/archive state. If `closed_won` and `lost` behave like outcomes rather than working columns, move them to status later.
- The current next action is the active task where `is_current_next_action = true`.

### `deal_participants`

Who is attached to a deal and what they can do there.

Important fields:

- `id`
- `organization_id`
- `deal_id`
- `subject_type`: membership, contact, company
- `subject_id`
- `participant_role`: am, broker, client, client_contact, va, observer
- `visibility`: internal, shared
- `status`: active, removed
- `created_at`
- `updated_at`

Relationships:

- Belongs to deal.
- Points to one subject per row: membership, contact, or company.
- Has permission grants.

Notes:

- This separates "can log in" from "is part of this deal."
- Use separate participant rows for a company and its contacts. Do not put multiple subject foreign keys on the same row.
- Company participation is modeled through this table. Do not add a separate deal-company table unless the relationship needs different behavior later.

### `permission_grants`

Capability overrides at organization, deal, document, or task scope.

Important fields:

- `id`
- `organization_id`
- `scope_type`: organization, deal, document, task
- `scope_id`
- `subject_type`: membership, participant, role
- `subject_id`: nullable only when `subject_type = role` and the role name is stored in metadata
- `capability`
- `effect`: allow, deny
- `created_by_membership_id`
- `metadata`
- `created_at`
- `revoked_at`

Relationships:

- Belongs to organization.
- Can reference a membership, deal participant, or role default.

Notes:

- Capabilities should be defined in code.
- "User permission" means permission through an organization membership, not through the global `users` row.
- Evaluate permissions in this order:
  1. Explicit deny on the narrowest relevant scope.
  2. Explicit allow on the narrowest relevant scope.
  3. Deal participant grants.
  4. Organization membership grants.
  5. Role default.
  6. Deny by default.
- Keep this table narrow and append-friendly.
- For the initial product, prefer deal-level grants and simple object visibility over complex per-document/per-task ACL management.

## Sharing and Visibility

Object visibility should stay simple in the initial product.

Visibility values:

- `internal`: visible only to AM/Admin and internal users with permission.
- `shared_with_deal_participants`: visible to active deal participants who also have the relevant view capability.
- `participants_only`: visible to message participants plus internal users.
- `uploader_only`: visible to uploader plus internal users.
- `assignee_only`: visible to assigned user plus internal users.

Rules:

- Visibility never grants access by itself. The user still needs the matching capability.
- Use `permission_grants` for exceptions only when deal-level permissions and object visibility are not enough.
- External activity views should be derived from explicit visibility, not from raw audit data.

## Channels and Messages

### `channels`

Inbound/outbound addresses or numbers owned by the organization.

Important fields:

- `id`
- `organization_id`
- `channel_type`: email, sms, voice
- `address`
- `provider`: ses, twilio, other
- `default_engagement_mode`: observe_only, respond_when_addressed, outbound_enabled
- `status`: active, disabled
- `created_at`
- `updated_at`

Relationships:

- Belongs to organization.
- Has many messages.

### `messages`

Email, SMS, voice transcript, internal note, or outbound draft/send record.

Important fields:

- `id`
- `organization_id`
- `deal_id`: nullable until routed
- `channel_id`: nullable
- `channel_type`: email, sms, voice, note
- `direction`: inbound, outbound, internal
- `message_status`: received, draft, pending_approval, sent, failed, hidden, redacted
- `provider_message_id`
- `source_task_id`: nullable
- `thread_key`
- `subject`
- `body_text`
- `body_html`: nullable
- `raw_source_storage_key`: nullable
- `redacted_at`: nullable
- `occurred_at`
- `routed_at`
- `routing_confidence`
- `routing_status`: routed, review_required, unrelated
- `visibility`: internal, shared_with_deal_participants, participants_only
- `engagement_mode`: passive, active
- `created_at`
- `updated_at`

Relationships:

- Belongs to organization.
- Optionally belongs to deal and channel.
- Has many participants.
- Documents created from attachments point back through `documents.source_message_id`.

Notes:

- Preserve original body content. Do not use normal edits for message body changes.
- Reassigning a message to a different deal should be audited.
- `raw_source_storage_key` points to raw provider payload storage for debugging ingestion without bloating the primary row.
- `source_task_id` links System-generated outbound drafts to the task that produced them.
- Visibility should be explicit enough to avoid leaking internal messages to external participants.

### `message_participants`

Senders, recipients, copied participants, or transcript speakers.

Important fields:

- `id`
- `organization_id`
- `message_id`
- `contact_id`: nullable
- `membership_id`: nullable
- `raw_name`
- `raw_handle`
- `participant_role`: from, to, cc, bcc, speaker
- `created_at`

Relationships:

- Belongs to message.
- Optionally links to contact or membership.

Notes:

- Keep raw handle fields so ingestion is debuggable even when identity resolution changes. For email this is an address; for SMS/voice this is usually a phone number.

### `routing_review_items`

Queue for inbound items below the configured routing confidence threshold.

Important fields:

- `id`
- `organization_id`
- `message_id`
- `suggested_deal_id`: nullable
- `resolved_deal_id`: nullable
- `confidence`
- `status`: open, resolved, dismissed
- `resolution`: assigned_to_deal, marked_unrelated, created_new_deal
- `resolved_by_membership_id`: nullable
- `resolved_at`
- `created_at`

Relationships:

- Belongs to message and organization.
- May point to suggested or resolved deal.

## Documents

### `documents`

Logical document record attached to a deal.

Important fields:

- `id`
- `organization_id`
- `deal_id`: nullable until filed
- `source_message_id`: nullable
- `uploaded_by_membership_id`: nullable
- `title`
- `document_type`: unknown, loi, lease, om, estoppel, comp_set, other
- `stage`: nullable
- `folder`: nullable
- `tags`
- `visibility`: internal, shared_with_deal_participants, uploader_only
- `status`: active, archived
- `classification_status`: pending, classified, failed
- `created_at`
- `updated_at`
- `archived_at`

Relationships:

- Belongs to organization.
- Optionally belongs to deal and source message.
- Has many versions.

Notes:

- Common document classification is async after filing, so `document_type` starts as unknown.

### `document_versions`

Physical file versions and extracted text.

Important fields:

- `id`
- `organization_id`
- `document_id`
- `storage_key`
- `filename`
- `mime_type`
- `file_size_bytes`
- `checksum`
- `version_number`
- `ocr_status`: pending, complete, failed, not_needed
- `extracted_text`
- `created_at`

Relationships:

- Belongs to document.

Notes:

- Store extracted text here or in a separate document text table later if size/search needs demand it.
- Keep versions because users may replace or revise documents.

## Tasks and Work

### `tasks`

Manual tasks, proposed next action, System work, VA work, and Self work.

Important fields:

- `id`
- `organization_id`
- `deal_id`
- `parent_message_id`: nullable
- `task_type`
- `title`
- `description`
- `status`: proposed, approved, in_progress, waiting_approval, completed, rejected, deferred, canceled
- `route`: system, va, self
- `visibility`: internal, shared_with_deal_participants, assignee_only
- `is_current_next_action`
- `proposed_by`: system, user
- `assigned_to_membership_id`: nullable
- `approved_by_membership_id`: nullable
- `payload`
- `due_at`: nullable
- `created_at`
- `updated_at`
- `completed_at`

Relationships:

- Belongs to deal.
- May have one VA work item.
- Has outcomes and audit events.

Notes:

- Use one table for proposed next actions and tasks. A proposed next action becomes actionable by status transition rather than moving to a different table.
- Enforce one current next action per deal with a partial unique index where `is_current_next_action = true` and status is not terminal.
- Generated outbound drafts link back to a task through `messages.source_task_id`.

### `va_work_items`

Internal VA queue item tied to a task.

Important fields:

- `id`
- `organization_id`
- `task_id`
- `deal_id`
- `assigned_to_membership_id`: nullable
- `status`: queued, in_progress, blocked, submitted, accepted, rejected, canceled
- `instructions`
- `submitted_payload`
- `submitted_at`
- `created_at`
- `updated_at`

Relationships:

- Belongs to task and deal.
- Assigned to VA membership.

Notes:

- This is an internal tab in the same app, not a separate product.

### `task_outcomes`

Structured result of a task or recommendation.

Important fields:

- `id`
- `organization_id`
- `task_id`
- `deal_id`
- `outcome`: accepted, edited, rejected, deferred, rerouted, completed
- `from_route`: nullable
- `to_route`: nullable
- `edit_summary`: nullable
- `created_by_membership_id`
- `created_at`

Relationships:

- Belongs to task and deal.

Notes:

- Keep this even though autonomy is omitted. It is useful for audit, QA, and later analytics.

### `approval_events`

History of approval decisions for proposed actions, outbound sends, stage changes, or submitted VA work.

Important fields:

- `id`
- `organization_id`
- `deal_id`
- `task_id`: nullable
- `message_id`: nullable
- `document_id`: nullable
- `approval_type`: stage_change, next_action, outbound_send, va_submission
- `decision`: approved, rejected, sent_back, canceled
- `decision_by_membership_id`
- `decision_reason`: nullable
- `created_at`

Relationships:

- Belongs to organization.
- Usually belongs to deal.
- May point to task, message, or document depending on what was approved.

Notes:

- This is the lightweight "approval history" for the initial product.
- It complements audit events: audit events answer what changed; approval events answer who decided and why.

## Audit

### `audit_events`

Append-only history of meaningful changes.

Important fields:

- `id`
- `organization_id`
- `actor_membership_id`: nullable for system
- `actor_type`: user, system
- `entity_type`
- `entity_id`
- `deal_id`: nullable
- `event_type`
- `before`
- `after`
- `metadata`
- `visibility`: internal, external_activity
- `created_at`

Relationships:

- Belongs to organization.
- Usually belongs to a deal.

Notes:

- Broker/client visible activity can be derived from audit events with visibility filtering, or copied into a simpler activity view later.
- Do not store full message/document bodies in `before`, `after`, or `metadata`. Store IDs, labels, sanitized field changes, and redaction-safe summaries.

## Suggested Indexes and Constraints

Important indexes:

- `organization_memberships(organization_id, user_id)`
- `contacts(organization_id, email)`
- `contacts(organization_id, phone)`
- `deals(organization_id, stage, status)`
- `deals(organization_id, owner_membership_id, status)`
- `deal_participants(deal_id, subject_type, subject_id)`
- `permission_grants(organization_id, scope_type, scope_id)`
- `messages(organization_id, deal_id, occurred_at)`
- `messages(organization_id, thread_key)`
- `messages(organization_id, routing_status)`
- `message_participants(organization_id, raw_handle)`
- `documents(organization_id, deal_id, status)`
- `documents(organization_id, classification_status)`
- `document_versions(document_id, version_number)`
- `tasks(organization_id, deal_id, status)`
- `tasks(organization_id, assigned_to_membership_id, status)`
- `routing_review_items(organization_id, status, created_at)`
- `va_work_items(organization_id, assigned_to_membership_id, status)`
- `approval_events(organization_id, deal_id, created_at)`
- `audit_events(organization_id, deal_id, created_at)`

Important constraints:

- Unique `users(auth_provider, auth_subject)`.
- Unique `organization_memberships(organization_id, user_id)`.
- Unique active current next action per deal.
- Message provider IDs should be unique per channel when present.
- Document version numbers should be unique per document.
- Deal participants should be unique per active `(deal_id, subject_type, subject_id, participant_role)`.
- Audit events are append-only.

## Deliberate Cuts

Do not add these to the initial data model:

- Autonomy policy tables.
- Trust dashboard snapshots.
- Prediction accuracy tables.
- Cross-org learning tables.
- Advanced priority scoring features.
- Separate data warehouse or analytics schema.
- Separate broker/client portal schema.

The core tables already preserve enough outcomes and audit history to support future analytics later.

## Open Data Model Questions

1. Should task `payload` be structured JSON per task type, or split into type-specific tables once common task types are known?
2. Do broker/client manual edits need a pre-approval workflow, or can permissions allow direct writes with audit history?
3. Is simple object visibility enough for external sharing, or do any initial workflows require per-document/per-task grants?

Closed for v1:

- No separate `clients` table. Use `companies.company_type = client`.
- Keep extracted document text on `document_versions`.
- One routed deal per message.
