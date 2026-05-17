import { Prisma } from "./generated/client/index.js";

export const seedIds = {
  organization: "org_northgate",
  users: {
    admin: "user_admin",
    am: "user_am",
    va: "user_va",
    broker: "user_broker",
    client: "user_client"
  },
  memberships: {
    admin: "mem_admin",
    am: "mem_am",
    va: "mem_va",
    broker: "mem_broker",
    client: "mem_client"
  },
  authSessions: {
    admin: "auth_session_admin",
    am: "auth_session_am",
    va: "auth_session_va",
    broker: "auth_session_broker",
    client: "auth_session_client"
  },
  authTokens: {
    admin: "seed-session-admin",
    am: "seed-session-am",
    va: "seed-session-va",
    broker: "seed-session-broker",
    client: "seed-session-client"
  },
  companies: {
    northgate: "company_northgate",
    halcyon: "company_halcyon",
    greylock: "company_greylock"
  },
  contacts: {
    admin: "contact_admin",
    am: "contact_am",
    va: "contact_va",
    broker: "contact_broker",
    client: "contact_client"
  },
  channels: {
    email: "channel_resend_email",
    sms: "channel_twilio_sms"
  },
  deals: {
    sutter: "deal_sutter",
    bryant: "deal_bryant"
  },
  messages: {
    loi: "msg_loi",
    note: "msg_note",
    unknown: "msg_unknown"
  },
  documents: {
    loi: "doc_loi",
    esa: "doc_esa"
  },
  documentVersions: {
    loi: "docv_loi_v1",
    esa: "docv_esa_v1"
  },
  tasks: {
    next: "task_next",
    va: "task_va"
  },
  vaWorkItems: {
    estoppel: "va_1"
  },
  routingReviewItems: {
    unknown: "rr_1"
  }
} as const;

const now = new Date("2026-05-17T15:45:00.000Z");
const sutterActivityAt = new Date("2026-05-17T14:00:00.000Z");
const bryantActivityAt = new Date("2026-05-16T16:00:00.000Z");
const dueAt = new Date("2026-05-19T18:00:00.000Z");

const jsonNull = Prisma.JsonNull;
const emptyObject = {} satisfies Prisma.InputJsonValue;
const emptyArray = [] satisfies Prisma.InputJsonValue;

export function buildSeedData() {
  const organizationId = seedIds.organization;

  const organizations = [
    {
      id: organizationId,
      name: "Northgate CRE",
      slug: "northgate",
      status: "active",
      routingConfidenceThreshold: 0.8,
      defaultTimezone: "America/Chicago",
      createdAt: now,
      updatedAt: now
    }
  ] satisfies Prisma.OrganizationCreateManyInput[];

  const users = [
    {
      id: seedIds.users.admin,
      authProvider: "better-auth",
      authSubject: "seed-admin",
      email: "admin@northgate.cre",
      phone: "+14155550100",
      displayName: "Avery Chen",
      status: "active",
      lastLoginAt: now,
      notificationPreferences: emptyObject,
      createdAt: now,
      updatedAt: now
    },
    {
      id: seedIds.users.am,
      authProvider: "better-auth",
      authSubject: "seed-am",
      email: "am@northgate.cre",
      phone: "+14155550101",
      displayName: "Maria Reyes",
      status: "active",
      lastLoginAt: now,
      notificationPreferences: emptyObject,
      createdAt: now,
      updatedAt: now
    },
    {
      id: seedIds.users.va,
      authProvider: "better-auth",
      authSubject: "seed-va",
      email: "va@northgate.cre",
      phone: "+14155550102",
      displayName: "Jordan Lee",
      status: "active",
      lastLoginAt: null,
      notificationPreferences: emptyObject,
      createdAt: now,
      updatedAt: now
    },
    {
      id: seedIds.users.broker,
      authProvider: "better-auth",
      authSubject: "seed-broker",
      email: "broker@halcyon.com",
      phone: "+14155550103",
      displayName: "Devon Asherton",
      status: "active",
      lastLoginAt: null,
      notificationPreferences: emptyObject,
      createdAt: now,
      updatedAt: now
    },
    {
      id: seedIds.users.client,
      authProvider: "better-auth",
      authSubject: "seed-client",
      email: "client@greylock.com",
      phone: "+14155550104",
      displayName: "Priya Shah",
      status: "active",
      lastLoginAt: null,
      notificationPreferences: emptyObject,
      createdAt: now,
      updatedAt: now
    }
  ] satisfies Prisma.UserCreateManyInput[];

  const memberships = [
    { id: seedIds.memberships.admin, organizationId, userId: seedIds.users.admin, role: "admin", status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.memberships.am, organizationId, userId: seedIds.users.am, role: "am", status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.memberships.va, organizationId, userId: seedIds.users.va, role: "va", status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.memberships.broker, organizationId, userId: seedIds.users.broker, role: "broker", status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.memberships.client, organizationId, userId: seedIds.users.client, role: "client", status: "active", createdAt: now, updatedAt: now }
  ] satisfies Prisma.OrganizationMembershipCreateManyInput[];

  const authSessions = [
    { id: seedIds.authSessions.admin, token: seedIds.authTokens.admin, userId: seedIds.users.admin, activeOrganizationId: organizationId, expiresAt: new Date("2026-06-17T15:45:00.000Z"), createdAt: now, updatedAt: now },
    { id: seedIds.authSessions.am, token: seedIds.authTokens.am, userId: seedIds.users.am, activeOrganizationId: organizationId, expiresAt: new Date("2026-06-17T15:45:00.000Z"), createdAt: now, updatedAt: now },
    { id: seedIds.authSessions.va, token: seedIds.authTokens.va, userId: seedIds.users.va, activeOrganizationId: organizationId, expiresAt: new Date("2026-06-17T15:45:00.000Z"), createdAt: now, updatedAt: now },
    { id: seedIds.authSessions.broker, token: seedIds.authTokens.broker, userId: seedIds.users.broker, activeOrganizationId: organizationId, expiresAt: new Date("2026-06-17T15:45:00.000Z"), createdAt: now, updatedAt: now },
    { id: seedIds.authSessions.client, token: seedIds.authTokens.client, userId: seedIds.users.client, activeOrganizationId: organizationId, expiresAt: new Date("2026-06-17T15:45:00.000Z"), createdAt: now, updatedAt: now }
  ] satisfies Prisma.AuthSessionCreateManyInput[];

  const companies = [
    { id: seedIds.companies.northgate, organizationId, name: "Northgate CRE", companyType: "other", status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.companies.halcyon, organizationId, name: "Halcyon Capital", companyType: "brokerage", status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.companies.greylock, organizationId, name: "Greylock Holdings", companyType: "client", status: "active", createdAt: now, updatedAt: now }
  ] satisfies Prisma.CompanyCreateManyInput[];

  const contacts = [
    { id: seedIds.contacts.admin, organizationId, userId: seedIds.users.admin, companyId: seedIds.companies.northgate, contactType: "internal", name: "Avery Chen", email: "admin@northgate.cre", phone: "+14155550100", notificationPreferences: emptyObject, status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.contacts.am, organizationId, userId: seedIds.users.am, companyId: seedIds.companies.northgate, contactType: "internal", name: "Maria Reyes", email: "am@northgate.cre", phone: "+14155550101", notificationPreferences: emptyObject, status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.contacts.va, organizationId, userId: seedIds.users.va, companyId: seedIds.companies.northgate, contactType: "internal", name: "Jordan Lee", email: "va@northgate.cre", phone: "+14155550102", notificationPreferences: emptyObject, status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.contacts.broker, organizationId, userId: seedIds.users.broker, companyId: seedIds.companies.halcyon, contactType: "broker", name: "Devon Asherton", email: "broker@halcyon.com", phone: "+14155550103", notificationPreferences: emptyObject, status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.contacts.client, organizationId, userId: seedIds.users.client, companyId: seedIds.companies.greylock, contactType: "client_contact", name: "Priya Shah", email: "client@greylock.com", phone: "+14155550104", notificationPreferences: emptyObject, status: "active", createdAt: now, updatedAt: now }
  ] satisfies Prisma.ContactCreateManyInput[];

  const channels = [
    { id: seedIds.channels.email, organizationId, channelType: "email", address: "deals@northgate.cre", provider: "resend", defaultEngagementMode: "outbound_enabled", status: "active", createdAt: now, updatedAt: now },
    { id: seedIds.channels.sms, organizationId, channelType: "sms", address: "+14155550188", provider: "twilio", defaultEngagementMode: "outbound_enabled", status: "active", createdAt: now, updatedAt: now }
  ] satisfies Prisma.ChannelCreateManyInput[];

  const deals = [
    {
      id: seedIds.deals.sutter,
      organizationId,
      title: "Sutter Tower - Floor 14",
      stage: "loi",
      status: "active",
      primaryCompanyId: seedIds.companies.halcyon,
      ownerMembershipId: seedIds.memberships.am,
      priorityRank: 1,
      staleFlag: false,
      lastInboundAt: sutterActivityAt,
      lastActivityAt: sutterActivityAt,
      createdAt: now,
      updatedAt: now
    },
    {
      id: seedIds.deals.bryant,
      organizationId,
      title: "401 Bryant - 12k sf office sublease",
      stage: "prospect",
      status: "active",
      primaryCompanyId: seedIds.companies.greylock,
      ownerMembershipId: seedIds.memberships.am,
      priorityRank: 2,
      staleFlag: true,
      lastInboundAt: bryantActivityAt,
      lastActivityAt: bryantActivityAt,
      createdAt: now,
      updatedAt: now
    }
  ] satisfies Prisma.DealCreateManyInput[];

  const dealParticipants = [
    { id: "part_sutter_am", organizationId, dealId: seedIds.deals.sutter, subjectType: "membership", subjectId: seedIds.memberships.am, participantRole: "am", visibility: "internal", status: "active", createdAt: now, updatedAt: now },
    { id: "part_sutter_va", organizationId, dealId: seedIds.deals.sutter, subjectType: "membership", subjectId: seedIds.memberships.va, participantRole: "va", visibility: "internal", status: "active", createdAt: now, updatedAt: now },
    { id: "part_sutter_broker", organizationId, dealId: seedIds.deals.sutter, subjectType: "membership", subjectId: seedIds.memberships.broker, participantRole: "broker", visibility: "shared_with_deal_participants", status: "active", createdAt: now, updatedAt: now },
    { id: "part_bryant_am", organizationId, dealId: seedIds.deals.bryant, subjectType: "membership", subjectId: seedIds.memberships.am, participantRole: "am", visibility: "internal", status: "active", createdAt: now, updatedAt: now },
    { id: "part_bryant_client", organizationId, dealId: seedIds.deals.bryant, subjectType: "membership", subjectId: seedIds.memberships.client, participantRole: "client", visibility: "shared_with_deal_participants", status: "active", createdAt: now, updatedAt: now }
  ] satisfies Prisma.DealParticipantCreateManyInput[];

  const permissionGrants = [
    { id: "perm_admin_org_all", organizationId, scopeType: "organization", scopeId: organizationId, subjectType: "role", subjectId: "admin", capability: "*", effect: "allow", createdByMembershipId: seedIds.memberships.admin, metadata: emptyObject, createdAt: now },
    { id: "perm_am_org_workflow", organizationId, scopeType: "organization", scopeId: organizationId, subjectType: "role", subjectId: "am", capability: "workflow.manage", effect: "allow", createdByMembershipId: seedIds.memberships.admin, metadata: emptyObject, createdAt: now },
    { id: "perm_va_queue", organizationId, scopeType: "organization", scopeId: organizationId, subjectType: "role", subjectId: "va", capability: "va.queue.manage", effect: "allow", createdByMembershipId: seedIds.memberships.admin, metadata: emptyObject, createdAt: now },
    { id: "perm_sutter_broker_view", organizationId, scopeType: "deal", scopeId: seedIds.deals.sutter, subjectType: "membership", subjectId: seedIds.memberships.broker, capability: "deal.view", effect: "allow", createdByMembershipId: seedIds.memberships.am, metadata: emptyObject, createdAt: now },
    { id: "perm_sutter_broker_upload", organizationId, scopeType: "deal", scopeId: seedIds.deals.sutter, subjectType: "membership", subjectId: seedIds.memberships.broker, capability: "document.upload", effect: "allow", createdByMembershipId: seedIds.memberships.am, metadata: emptyObject, createdAt: now },
    { id: "perm_bryant_client_view", organizationId, scopeType: "deal", scopeId: seedIds.deals.bryant, subjectType: "membership", subjectId: seedIds.memberships.client, capability: "deal.view", effect: "allow", createdByMembershipId: seedIds.memberships.am, metadata: emptyObject, createdAt: now }
  ] satisfies Prisma.PermissionGrantCreateManyInput[];

  const messages = [
    { id: seedIds.messages.loi, organizationId, dealId: seedIds.deals.sutter, channelId: seedIds.channels.email, channelType: "email", direction: "inbound", messageStatus: "received", providerMessageId: "resend_loi", threadKey: "sutter-loi", subject: "LOI - Sutter Tower Floor 14", bodyText: "Attached our LOI per our call. Looking forward to feedback by Friday.", occurredAt: sutterActivityAt, routedAt: sutterActivityAt, routingConfidence: 0.97, routingStatus: "routed", visibility: "shared_with_deal_participants", engagementMode: "passive", createdAt: now, updatedAt: now },
    { id: seedIds.messages.note, organizationId, dealId: seedIds.deals.sutter, channelId: null, channelType: "note", direction: "internal", messageStatus: "received", providerMessageId: null, threadKey: "sutter-internal", subject: "Internal note", bodyText: "Halcyon's TI ask is below market. Push back to $85/sf.", occurredAt: new Date("2026-05-17T15:00:00.000Z"), routedAt: new Date("2026-05-17T15:00:00.000Z"), routingConfidence: null, routingStatus: "routed", visibility: "internal", engagementMode: "passive", createdAt: now, updatedAt: now },
    { id: seedIds.messages.unknown, organizationId, dealId: null, channelId: seedIds.channels.email, channelType: "email", direction: "inbound", messageStatus: "received", providerMessageId: "resend_unknown", threadKey: "bryant-interest", subject: "401 Bryant - interested party", bodyText: "Saw the listing and can tour Friday.", occurredAt: new Date("2026-05-17T15:32:00.000Z"), routedAt: null, routingConfidence: 0.41, routingStatus: "review_required", visibility: "internal", engagementMode: "passive", createdAt: now, updatedAt: now }
  ] satisfies Prisma.MessageCreateManyInput[];

  const messageParticipants = [
    { id: "mp_loi_from", organizationId, messageId: seedIds.messages.loi, contactId: seedIds.contacts.broker, membershipId: seedIds.memberships.broker, rawName: "Devon Asherton", rawHandle: "broker@halcyon.com", participantRole: "from", createdAt: now },
    { id: "mp_loi_to", organizationId, messageId: seedIds.messages.loi, contactId: seedIds.contacts.am, membershipId: seedIds.memberships.am, rawName: "Maria Reyes", rawHandle: "deals@northgate.cre", participantRole: "to", createdAt: now },
    { id: "mp_unknown_from", organizationId, messageId: seedIds.messages.unknown, contactId: null, membershipId: null, rawName: "Unknown Sender", rawHandle: "unknown@gmail.com", participantRole: "from", createdAt: now }
  ] satisfies Prisma.MessageParticipantCreateManyInput[];

  const routingReviewItems = [
    { id: seedIds.routingReviewItems.unknown, organizationId, messageId: seedIds.messages.unknown, suggestedDealId: seedIds.deals.bryant, resolvedDealId: null, confidence: 0.41, status: "open", resolution: null, resolvedByMembershipId: null, resolvedAt: null, createdAt: new Date("2026-05-17T15:32:00.000Z") }
  ] satisfies Prisma.RoutingReviewItemCreateManyInput[];

  const documents = [
    { id: seedIds.documents.loi, organizationId, dealId: seedIds.deals.sutter, sourceMessageId: seedIds.messages.loi, uploadedByMembershipId: seedIds.memberships.broker, title: "LOI - Sutter Tower Floor 14.pdf", documentType: "loi", folder: "LOI", tags: ["loi"], visibility: "shared_with_deal_participants", status: "active", classificationStatus: "classified", createdAt: now, updatedAt: now },
    { id: seedIds.documents.esa, organizationId, dealId: seedIds.deals.sutter, sourceMessageId: null, uploadedByMembershipId: seedIds.memberships.am, title: "Phase 1 ESA.pdf", documentType: "unknown", folder: "Diligence", tags: emptyArray, visibility: "internal", status: "active", classificationStatus: "pending", createdAt: now, updatedAt: now }
  ] satisfies Prisma.DocumentCreateManyInput[];

  const documentVersions = [
    { id: seedIds.documentVersions.loi, organizationId, documentId: seedIds.documents.loi, storageKey: "seed/org_northgate/deal_sutter/loi-floor-14.pdf", filename: "LOI - Sutter Tower Floor 14.pdf", mimeType: "application/pdf", fileSizeBytes: 124000, checksum: "sha256-seed-loi", versionNumber: 1, ocrStatus: "not_needed", extractedText: null, createdAt: now },
    { id: seedIds.documentVersions.esa, organizationId, documentId: seedIds.documents.esa, storageKey: "seed/org_northgate/deal_sutter/phase-1-esa.pdf", filename: "Phase 1 ESA.pdf", mimeType: "application/pdf", fileSizeBytes: 98000, checksum: "sha256-seed-esa", versionNumber: 1, ocrStatus: "pending", extractedText: null, createdAt: now }
  ] satisfies Prisma.DocumentVersionCreateManyInput[];

  const tasks = [
    { id: seedIds.tasks.next, organizationId, dealId: seedIds.deals.sutter, parentMessageId: seedIds.messages.loi, taskType: "outbound_reply", title: "Send LOI response to Halcyon", description: "Counter on TI allowance and request 6 months free rent.", status: "waiting_approval", route: "system", visibility: "internal", isCurrentNextAction: true, currentNextActionKey: `${seedIds.deals.sutter}:current-next-action`, proposedBy: "system", assignedToMembershipId: seedIds.memberships.am, approvedByMembershipId: null, payload: { draft: "Hi Devon, thanks for the LOI. We can make the economics work with a revised TI allowance and six months free rent." }, dueAt: null, createdAt: now, updatedAt: now, completedAt: null },
    { id: seedIds.tasks.va, organizationId, dealId: seedIds.deals.sutter, parentMessageId: null, taskType: "document_request", title: "Pull estoppel cert", description: "Request current tenant estoppel.", status: "in_progress", route: "va", visibility: "internal", isCurrentNextAction: false, currentNextActionKey: null, proposedBy: "user", assignedToMembershipId: seedIds.memberships.va, approvedByMembershipId: seedIds.memberships.am, payload: emptyObject, dueAt, createdAt: now, updatedAt: now, completedAt: null }
  ] satisfies Prisma.TaskCreateManyInput[];

  const vaWorkItems = [
    { id: seedIds.vaWorkItems.estoppel, organizationId, taskId: seedIds.tasks.va, dealId: seedIds.deals.sutter, assignedToMembershipId: seedIds.memberships.va, status: "queued", instructions: "Reach out to building management and pull the current tenant estoppel certificate.", submittedPayload: jsonNull, submittedAt: null, createdAt: now, updatedAt: now }
  ] satisfies Prisma.VaWorkItemCreateManyInput[];

  const taskOutcomes = [
    { id: "outcome_seed_next", organizationId, taskId: seedIds.tasks.next, dealId: seedIds.deals.sutter, outcome: "edited", fromRoute: "system", toRoute: "system", editSummary: "AM adjusted the draft before approval.", createdByMembershipId: seedIds.memberships.am, createdAt: new Date("2026-05-17T15:10:00.000Z") }
  ] satisfies Prisma.TaskOutcomeCreateManyInput[];

  const approvalEvents = [
    { id: "approval_seed_reply", organizationId, dealId: seedIds.deals.sutter, taskId: seedIds.tasks.next, messageId: null, documentId: null, approvalType: "outbound_send", decision: "approved", decisionByMembershipId: seedIds.memberships.am, decisionReason: "Draft reflects negotiation position.", createdAt: new Date("2026-05-16T14:00:00.000Z") }
  ] satisfies Prisma.ApprovalEventCreateManyInput[];

  const auditEvents = [
    { id: "audit_seed_loi_routed", organizationId, actorMembershipId: null, actorType: "system", entityType: "message", entityId: seedIds.messages.loi, dealId: seedIds.deals.sutter, eventType: "message.routed", before: jsonNull, after: { dealId: seedIds.deals.sutter, routingStatus: "routed" }, metadata: { source: "seed" }, visibility: "internal", createdAt: sutterActivityAt },
    { id: "audit_seed_reply_approved", organizationId, actorMembershipId: seedIds.memberships.am, actorType: "user", entityType: "task", entityId: seedIds.tasks.next, dealId: seedIds.deals.sutter, eventType: "task.approved", before: { status: "proposed" }, after: { status: "waiting_approval" }, metadata: { source: "seed" }, visibility: "internal", createdAt: new Date("2026-05-16T14:00:00.000Z") }
  ] satisfies Prisma.AuditEventCreateManyInput[];

  return {
    organizationId,
    organizations,
    users,
    memberships,
    authSessions,
    companies,
    contacts,
    channels,
    deals,
    dealParticipants,
    permissionGrants,
    messages,
    messageParticipants,
    routingReviewItems,
    documents,
    documentVersions,
    tasks,
    vaWorkItems,
    taskOutcomes,
    approvalEvents,
    auditEvents
  };
}
