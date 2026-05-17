-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('invited', 'active', 'disabled');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('admin', 'am', 'va', 'broker', 'client');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('broker', 'client_contact', 'internal', 'other');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('client', 'landlord', 'tenant', 'buyer', 'seller', 'brokerage', 'other');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('prospect', 'loi', 'negotiation', 'diligence', 'close', 'closed_won', 'lost');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('active', 'archived', 'closed');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('membership', 'contact', 'company', 'participant', 'role');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('am', 'broker', 'client', 'client_contact', 'va', 'observer');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('internal', 'shared_with_deal_participants', 'participants_only', 'uploader_only', 'assignee_only', 'external_activity');

-- CreateEnum
CREATE TYPE "GrantScopeType" AS ENUM ('organization', 'deal', 'document', 'task');

-- CreateEnum
CREATE TYPE "GrantEffect" AS ENUM ('allow', 'deny');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('email', 'sms', 'voice', 'note');

-- CreateEnum
CREATE TYPE "ChannelProvider" AS ENUM ('resend', 'twilio', 'other');

-- CreateEnum
CREATE TYPE "EngagementMode" AS ENUM ('observe_only', 'respond_when_addressed', 'outbound_enabled', 'passive', 'active');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound', 'internal');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('received', 'draft', 'pending_approval', 'sent', 'failed', 'hidden', 'redacted');

-- CreateEnum
CREATE TYPE "RoutingStatus" AS ENUM ('routed', 'review_required', 'unrelated');

-- CreateEnum
CREATE TYPE "MessageParticipantRole" AS ENUM ('from', 'to', 'cc', 'bcc', 'speaker');

-- CreateEnum
CREATE TYPE "RoutingReviewStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "RoutingReviewResolution" AS ENUM ('assigned_to_deal', 'marked_unrelated', 'created_new_deal');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('unknown', 'loi', 'lease', 'om', 'estoppel', 'comp_set', 'other');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "ClassificationStatus" AS ENUM ('pending', 'classified', 'failed');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('pending', 'complete', 'failed', 'not_needed');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('proposed', 'approved', 'in_progress', 'waiting_approval', 'completed', 'rejected', 'deferred', 'canceled');

-- CreateEnum
CREATE TYPE "TaskRoute" AS ENUM ('system', 'va', 'self');

-- CreateEnum
CREATE TYPE "ProposedBy" AS ENUM ('system', 'user');

-- CreateEnum
CREATE TYPE "VaWorkStatus" AS ENUM ('queued', 'in_progress', 'blocked', 'submitted', 'accepted', 'rejected', 'canceled', 'sent_back');

-- CreateEnum
CREATE TYPE "TaskOutcomeValue" AS ENUM ('accepted', 'edited', 'rejected', 'deferred', 'rerouted', 'completed');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('stage_change', 'next_action', 'outbound_send', 'va_submission');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('approved', 'rejected', 'sent_back', 'canceled');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('user', 'system');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrgStatus" NOT NULL DEFAULT 'active',
    "routing_confidence_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "default_timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "auth_provider" TEXT NOT NULL,
    "auth_subject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'invited',
    "last_login_at" TIMESTAMP(3),
    "notification_preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'invited',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "company_id" TEXT,
    "contact_type" "ContactType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notification_preferences" JSONB NOT NULL DEFAULT '{}',
    "status" "DocumentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_type" "CompanyType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage" "DealStage" NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'active',
    "primary_company_id" TEXT,
    "owner_membership_id" TEXT NOT NULL,
    "priority_rank" INTEGER,
    "stale_flag" BOOLEAN NOT NULL DEFAULT false,
    "last_inbound_at" TIMESTAMP(3),
    "last_outbound_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_participants" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "subject_type" "SubjectType" NOT NULL,
    "subject_id" TEXT NOT NULL,
    "participant_role" "ParticipantRole" NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'shared_with_deal_participants',
    "status" "DocumentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_grants" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "scope_type" "GrantScopeType" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "subject_type" "SubjectType" NOT NULL,
    "subject_id" TEXT,
    "capability" TEXT NOT NULL,
    "effect" "GrantEffect" NOT NULL,
    "created_by_membership_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "permission_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "channel_type" "ChannelType" NOT NULL,
    "address" TEXT NOT NULL,
    "provider" "ChannelProvider" NOT NULL,
    "default_engagement_mode" "EngagementMode" NOT NULL DEFAULT 'observe_only',
    "status" "DocumentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "channel_id" TEXT,
    "channel_type" "ChannelType" NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "message_status" "MessageStatus" NOT NULL DEFAULT 'received',
    "provider_message_id" TEXT,
    "source_task_id" TEXT,
    "thread_key" TEXT,
    "subject" TEXT,
    "body_text" TEXT NOT NULL,
    "body_html" TEXT,
    "raw_source_storage_key" TEXT,
    "redacted_at" TIMESTAMP(3),
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "routed_at" TIMESTAMP(3),
    "routing_confidence" DOUBLE PRECISION,
    "routing_status" "RoutingStatus" NOT NULL DEFAULT 'review_required',
    "visibility" "Visibility" NOT NULL DEFAULT 'internal',
    "engagement_mode" "EngagementMode" NOT NULL DEFAULT 'passive',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_participants" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "membership_id" TEXT,
    "raw_name" TEXT,
    "raw_handle" TEXT NOT NULL,
    "participant_role" "MessageParticipantRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_review_items" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "suggested_deal_id" TEXT,
    "resolved_deal_id" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "RoutingReviewStatus" NOT NULL DEFAULT 'open',
    "resolution" "RoutingReviewResolution",
    "resolved_by_membership_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routing_review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "source_message_id" TEXT,
    "uploaded_by_membership_id" TEXT,
    "title" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL DEFAULT 'unknown',
    "stage" TEXT,
    "folder" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "visibility" "Visibility" NOT NULL DEFAULT 'internal',
    "status" "DocumentStatus" NOT NULL DEFAULT 'active',
    "classification_status" "ClassificationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "ocr_status" "OcrStatus" NOT NULL DEFAULT 'pending',
    "extracted_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "parent_message_id" TEXT,
    "task_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'proposed',
    "route" "TaskRoute" NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'internal',
    "is_current_next_action" BOOLEAN NOT NULL DEFAULT false,
    "current_next_action_key" TEXT,
    "proposed_by" "ProposedBy" NOT NULL DEFAULT 'user',
    "assigned_to_membership_id" TEXT,
    "approved_by_membership_id" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "va_work_items" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "assigned_to_membership_id" TEXT,
    "status" "VaWorkStatus" NOT NULL DEFAULT 'queued',
    "instructions" TEXT NOT NULL,
    "submitted_payload" JSONB,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "va_work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_outcomes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "outcome" "TaskOutcomeValue" NOT NULL,
    "from_route" "TaskRoute",
    "to_route" "TaskRoute",
    "edit_summary" TEXT,
    "created_by_membership_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "task_id" TEXT,
    "message_id" TEXT,
    "document_id" TEXT,
    "approval_type" "ApprovalType" NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "decision_by_membership_id" TEXT NOT NULL,
    "decision_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "actor_membership_id" TEXT,
    "actor_type" "ActorType" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "event_type" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "visibility" "Visibility" NOT NULL DEFAULT 'internal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_auth_subject_key" ON "users"("auth_provider", "auth_subject");

-- CreateIndex
CREATE INDEX "organization_memberships_organization_id_role_status_idx" ON "organization_memberships"("organization_id", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_organization_id_user_id_key" ON "organization_memberships"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "contacts_organization_id_email_idx" ON "contacts"("organization_id", "email");

-- CreateIndex
CREATE INDEX "contacts_organization_id_phone_idx" ON "contacts"("organization_id", "phone");

-- CreateIndex
CREATE INDEX "companies_organization_id_name_idx" ON "companies"("organization_id", "name");

-- CreateIndex
CREATE INDEX "deals_organization_id_stage_status_idx" ON "deals"("organization_id", "stage", "status");

-- CreateIndex
CREATE INDEX "deals_organization_id_owner_membership_id_status_idx" ON "deals"("organization_id", "owner_membership_id", "status");

-- CreateIndex
CREATE INDEX "deal_participants_organization_id_deal_id_idx" ON "deal_participants"("organization_id", "deal_id");

-- CreateIndex
CREATE UNIQUE INDEX "deal_participants_deal_id_subject_type_subject_id_participa_key" ON "deal_participants"("deal_id", "subject_type", "subject_id", "participant_role");

-- CreateIndex
CREATE INDEX "permission_grants_organization_id_scope_type_scope_id_idx" ON "permission_grants"("organization_id", "scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "channels_organization_id_channel_type_status_idx" ON "channels"("organization_id", "channel_type", "status");

-- CreateIndex
CREATE INDEX "messages_organization_id_deal_id_occurred_at_idx" ON "messages"("organization_id", "deal_id", "occurred_at");

-- CreateIndex
CREATE INDEX "messages_organization_id_thread_key_idx" ON "messages"("organization_id", "thread_key");

-- CreateIndex
CREATE INDEX "messages_organization_id_routing_status_idx" ON "messages"("organization_id", "routing_status");

-- CreateIndex
CREATE UNIQUE INDEX "messages_channel_id_provider_message_id_key" ON "messages"("channel_id", "provider_message_id");

-- CreateIndex
CREATE INDEX "message_participants_organization_id_raw_handle_idx" ON "message_participants"("organization_id", "raw_handle");

-- CreateIndex
CREATE INDEX "routing_review_items_organization_id_status_created_at_idx" ON "routing_review_items"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "documents_organization_id_deal_id_status_idx" ON "documents"("organization_id", "deal_id", "status");

-- CreateIndex
CREATE INDEX "documents_organization_id_classification_status_idx" ON "documents"("organization_id", "classification_status");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_document_id_version_number_key" ON "document_versions"("document_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_current_next_action_key_key" ON "tasks"("current_next_action_key");

-- CreateIndex
CREATE INDEX "tasks_organization_id_deal_id_status_idx" ON "tasks"("organization_id", "deal_id", "status");

-- CreateIndex
CREATE INDEX "tasks_organization_id_assigned_to_membership_id_status_idx" ON "tasks"("organization_id", "assigned_to_membership_id", "status");

-- CreateIndex
CREATE INDEX "va_work_items_organization_id_assigned_to_membership_id_sta_idx" ON "va_work_items"("organization_id", "assigned_to_membership_id", "status");

-- CreateIndex
CREATE INDEX "task_outcomes_organization_id_deal_id_created_at_idx" ON "task_outcomes"("organization_id", "deal_id", "created_at");

-- CreateIndex
CREATE INDEX "approval_events_organization_id_deal_id_created_at_idx" ON "approval_events"("organization_id", "deal_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_deal_id_created_at_idx" ON "audit_events"("organization_id", "deal_id", "created_at");

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_primary_company_id_fkey" FOREIGN KEY ("primary_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_participants" ADD CONSTRAINT "deal_participants_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_participants" ADD CONSTRAINT "message_participants_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_source_message_id_fkey" FOREIGN KEY ("source_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "va_work_items" ADD CONSTRAINT "va_work_items_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Enforce one active current next action per deal. Prisma schema cannot express a partial unique index.
CREATE UNIQUE INDEX IF NOT EXISTS "tasks_one_current_next_action_per_deal"
  ON "tasks" ("deal_id")
  WHERE "is_current_next_action" = true
    AND "status" NOT IN ('completed', 'rejected', 'canceled');
