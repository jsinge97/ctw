import type { ActivityEventDto, DealDto, DocumentDto, MessageDto, ParticipantDto, RoutingReviewItemDto, TaskDto, UserDto, VaWorkItemDto, OrganizationSettingsDto } from "@ctw/contracts";

export const orgId = "org_demo";

export const deals: DealDto[] = [
  { id: "deal_sutter", organizationId: orgId, title: "Sutter Tower - Floor 14", primaryCompanyName: "Halcyon Capital", stage: "loi", status: "active", ownerInitials: "MR", staleFlag: false, lastActivityAt: "2026-05-17T14:00:00.000Z", nextActionLabel: "Send LOI response", pendingApprovals: 1, capabilities: ["viewDeal", "moveDealStage", "approveOutboundSend"] },
  { id: "deal_bryant", organizationId: orgId, title: "401 Bryant - 12k sf office sublease", primaryCompanyName: "Greylock Holdings", stage: "prospect", status: "active", ownerInitials: "JT", staleFlag: true, lastActivityAt: "2026-05-16T16:00:00.000Z", nextActionLabel: "Reply to broker intro", pendingApprovals: 0, capabilities: ["viewDeal"] }
];

export const participants: ParticipantDto[] = [
  { id: "part_maria", dealId: "deal_sutter", name: "Maria Reyes", company: "Northgate CRE", role: "am", visibility: "internal", capabilities: ["All capabilities"], status: "active" },
  { id: "part_devon", dealId: "deal_sutter", name: "Devon Asherton", company: "Halcyon Capital", role: "broker", visibility: "shared", capabilities: ["View deal", "Upload documents"], status: "active" }
];

export const messages: MessageDto[] = [
  { id: "msg_loi", dealId: "deal_sutter", channelType: "email", direction: "inbound", messageStatus: "received", providerMessageId: "resend_loi", subject: "LOI - Sutter Tower Floor 14", preview: "Attached our LOI per our call.", bodyText: "Attached our LOI per our call. Looking forward to feedback by Friday.", occurredAt: "2026-05-17T14:00:00.000Z", visibility: "shared", routingConfidence: 0.97, routingStatus: "routed" },
  { id: "msg_note", dealId: "deal_sutter", channelType: "note", direction: "internal", messageStatus: "received", providerMessageId: null, subject: "Internal note", preview: "Push back on TI allowance.", bodyText: "Halcyon's TI ask is below market. Push back to $85/sf.", occurredAt: "2026-05-17T15:00:00.000Z", visibility: "internal", routingConfidence: null, routingStatus: "routed" },
  { id: "msg_unknown", dealId: null, channelType: "email", direction: "inbound", messageStatus: "received", providerMessageId: "resend_unknown", subject: "401 Bryant - interested party", preview: "Saw the listing and can tour Friday.", bodyText: "Saw the listing and can tour Friday.", occurredAt: "2026-05-17T15:32:00.000Z", visibility: "internal", routingConfidence: 0.41, routingStatus: "review_required" }
];

export const documents: DocumentDto[] = [
  { id: "doc_loi", dealId: "deal_sutter", title: "LOI - Sutter Tower Floor 14.pdf", documentType: "loi", classificationStatus: "classified", latestVersion: "v1", visibility: "shared", folder: "LOI", tags: ["loi"] },
  { id: "doc_esa", dealId: "deal_sutter", title: "Phase 1 ESA.pdf", documentType: "unknown", classificationStatus: "pending", latestVersion: "v1", visibility: "internal", folder: "Diligence", tags: [] }
];

export const tasks: TaskDto[] = [
  { id: "task_next", dealId: "deal_sutter", title: "Send LOI response to Halcyon", description: "Counter on TI allowance and request 6 months free rent.", status: "waiting_approval", route: "system", isCurrentNextAction: true, payload: { draft: "Hi Devon, thanks for the LOI..." }, dueAt: null },
  { id: "task_va", dealId: "deal_sutter", title: "Pull estoppel cert", description: "Request current tenant estoppel.", status: "in_progress", route: "va", isCurrentNextAction: false, payload: {}, dueAt: "2026-05-19T18:00:00.000Z" }
];

export const routingReviewItems: RoutingReviewItemDto[] = [
  { id: "rr_1", messageId: "msg_unknown", suggestedDealId: "deal_bryant", suggestedDealTitle: "401 Bryant - 12k sf office sublease", confidence: 0.41, sender: "unknown@gmail.com", subject: "401 Bryant - interested party", preview: "Saw the listing and can tour Friday.", ageLabel: "28m", explanation: "Subject mentions address; sender is new.", status: "open", resolution: null, resolvedDealId: null, resolvedAt: null }
];

export const vaWorkItems: VaWorkItemDto[] = [
  { id: "va_1", taskId: "task_va", dealId: "deal_sutter", title: "Pull estoppel cert", dealTitle: "Sutter Tower - Floor 14", status: "queued", instructions: "Reach out to building management.", assignedTo: null, submittedPayload: null, notes: null, sentBackReason: null, history: [] }
];

export const activityEvents: ActivityEventDto[] = [
  { id: "act_1", dealId: "deal_sutter", actor: "System", action: "filed", summary: "Email from Devon filed to Sutter Tower", type: "Routing", createdAt: "2026-05-17T14:00:00.000Z" },
  { id: "act_2", dealId: "deal_sutter", actor: "Maria Reyes", action: "approved", summary: "Approved tour confirmation", type: "Approval", createdAt: "2026-05-16T14:00:00.000Z" }
];

export const users: UserDto[] = [
  { id: "user_am", name: "Maria Reyes", email: "am@northgate.cre", role: "am", status: "active", lastLoginAt: "2026-05-17T15:00:00.000Z" },
  { id: "user_broker", name: "Devon Asherton", email: "broker@halcyon.com", role: "broker", status: "active", lastLoginAt: null }
];

export const organizationSettings: OrganizationSettingsDto = {
  id: orgId,
  name: "Northgate CRE",
  slug: "northgate",
  routingConfidenceThreshold: 0.8,
  channels: [
    { id: "chan_email", type: "email", address: "deals@northgate.cre", provider: "Resend", mode: "outbound_enabled", status: "active" },
    { id: "chan_sms", type: "sms", address: "+14155550188", provider: "Twilio", mode: "outbound_enabled", status: "active" }
  ]
};

export function nextId(prefix: string, size: number): string {
  return `${prefix}_${size + 1}`;
}
