import { DocumentType, ParticipantRole, Prisma, TaskStatus, type EngagementMode, type PrismaClient } from "../generated/client/index.js";

type DealStage = "prospect" | "loi" | "negotiation" | "diligence" | "close" | "closed_won" | "lost";
type VisibilityDto = "internal" | "shared";
type TaskRoute = "system" | "va" | "self";
type VaWorkStatus = "queued" | "in_progress" | "blocked" | "submitted" | "accepted" | "rejected" | "canceled" | "sent_back";

type DealRow = Prisma.DealGetPayload<{ include: { primaryCompany: true; tasks: true } }>;
type MessageRow = Prisma.MessageGetPayload<object>;
type DocumentRow = Prisma.DocumentGetPayload<object> & { versions?: Array<Prisma.DocumentVersionGetPayload<object>> };
type TaskRow = Prisma.TaskGetPayload<object>;
type VaWorkItemRow = Prisma.VaWorkItemGetPayload<{ include: { task: { include: { deal: true } } } }>;
type RoutingReviewRow = Prisma.RoutingReviewItemGetPayload<object>;
type DocumentVersionInput = { storageKey: string; filename: string; mimeType: string; fileSizeBytes: number; checksum: string };

export type WorkflowRepository = {
  listDeals: (organizationId: string, membershipId?: string, role?: string) => Promise<unknown[]>;
  getDeal: (organizationId: string, dealId: string) => Promise<unknown>;
  createDeal: (input: { organizationId: string; title: string; primaryCompanyName?: string | null; ownerMembershipId: string }) => Promise<unknown>;
  patchDeal: (input: { organizationId: string; dealId: string; title?: string; primaryCompanyName?: string | null; staleFlag?: boolean }) => Promise<unknown>;
  moveDealStage: (input: { organizationId: string; dealId: string; stage: DealStage; membershipId: string }) => Promise<unknown>;
  archiveDeal: (input: { organizationId: string; dealId: string; membershipId: string }) => Promise<unknown>;
  listParticipants: (organizationId: string, dealId: string, includeInternal?: boolean) => Promise<unknown[]>;
  addParticipant: (input: { organizationId: string; dealId: string; name: string; company?: string | null; role: string; capabilities: string[]; membershipId?: string | null; actorMembershipId?: string | null }) => Promise<unknown>;
  updateParticipant: (input: { organizationId: string; dealId: string; participantId: string; visibility?: VisibilityDto; capabilities?: string[]; status?: "active" | "removed"; actorMembershipId?: string | null }) => Promise<unknown>;
  listMessagesForDeal: (organizationId: string, dealId: string, includeInternal?: boolean) => Promise<unknown[]>;
  createInboundMessage: (input: { organizationId: string; dealId: string | null; channelId?: string | null; channelType: "email" | "sms"; providerMessageId?: string | null; subject?: string | null; bodyText: string; sender?: string | null; recipient?: string | null; routingConfidence?: number | null; routingStatus: "routed" | "review_required" | "unrelated"; visibility: VisibilityDto; rawProviderPayload?: unknown }) => Promise<unknown>;
  updateMessageRouting: (input: { organizationId: string; messageId: string; dealId: string | null; routingStatus: "routed" | "review_required" | "unrelated" }) => Promise<unknown>;
  updateMessage: (input: { organizationId: string; dealId: string; messageId: string; nextDealId?: string | null; visibility?: VisibilityDto; hidden?: boolean; redacted?: boolean }) => Promise<unknown>;
  appendOutboundMessage: (input: { organizationId: string; dealId: string; taskId: string; providerMessageId: string | null; messageStatus: "sent" | "failed"; subject: string; bodyText: string; rawProviderResponse?: unknown }) => Promise<unknown>;
  listDocumentsForDeal: (organizationId: string, dealId: string, includeInternal?: boolean) => Promise<unknown[]>;
  createDocument: (input: { organizationId: string; dealId: string | null; sourceMessageId?: string | null; title: string; documentType?: string; visibility: VisibilityDto; folder?: string | null; tags?: string[]; uploadedByMembershipId?: string | null; version?: DocumentVersionInput }) => Promise<unknown>;
  updateDocument: (input: { organizationId: string; dealId: string; documentId: string; title?: string; documentType?: string; visibility?: VisibilityDto; folder?: string | null; tags?: string[] }) => Promise<unknown>;
  archiveDocument: (input: { organizationId: string; dealId: string; documentId: string }) => Promise<unknown>;
  listTasksForDeal: (organizationId: string, dealId: string) => Promise<unknown[]>;
  getTask: (organizationId: string, taskId: string) => Promise<unknown>;
  createTask: (input: { organizationId: string; dealId: string; title: string; description?: string | null; route: TaskRoute; assignedToMembershipId?: string | null; payload?: unknown }) => Promise<unknown>;
  updateTask: (input: { organizationId: string; taskId: string; title?: string; status?: string; route?: TaskRoute; payload?: unknown; completedAt?: Date | null }) => Promise<unknown>;
  setCurrentNextAction: (input: { organizationId: string; dealId: string; taskId: string }) => Promise<unknown>;
  listRoutingReviewItems: (organizationId: string) => Promise<unknown[]>;
  createRoutingReviewItem: (input: { organizationId: string; messageId: string; suggestedDealId?: string | null; confidence: number }) => Promise<unknown>;
  resolveRoutingReviewItem: (input: { organizationId: string; itemId: string; resolvedDealId: string | null; resolution: "assigned_to_deal" | "marked_unrelated" | "created_new_deal"; membershipId: string }) => Promise<unknown>;
  listVaWorkItems: (organizationId: string, membershipId?: string) => Promise<unknown[]>;
  updateVaWorkItem: (input: { organizationId: string; itemId: string; status: VaWorkStatus; assignedToMembershipId?: string | null; submittedPayload?: unknown }) => Promise<unknown>;
  listDealActivity: (organizationId: string, dealId: string, includeInternal?: boolean) => Promise<unknown[]>;
  getOrganizationSettings: (organizationId: string) => Promise<unknown>;
  findOrganizationByChannelAddress: (channelType: "email" | "sms", address: string) => Promise<{ organizationId: string; channelId: string } | null>;
  updateOrganizationSettings: (input: { organizationId: string; name?: string; routingConfidenceThreshold?: number }) => Promise<unknown>;
  updateOrganizationChannel: (input: { organizationId: string; channelId: string; mode?: string; status?: string }) => Promise<unknown>;
  previewRoutingThreshold: (organizationId: string, threshold: number) => Promise<unknown>;
  listUsers: (organizationId: string) => Promise<unknown[]>;
  inviteUser: (input: { organizationId: string; email: string; name: string; role: "admin" | "am" | "va" | "broker" | "client" }) => Promise<unknown>;
  updateUser: (input: { organizationId: string; userId: string; role?: "admin" | "am" | "va" | "broker" | "client"; status?: "active" | "disabled" }) => Promise<unknown>;
  resendUserInvitation: (input: { organizationId: string; userId: string }) => Promise<unknown>;
};

export class PrismaWorkflowRepository implements WorkflowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listDeals(organizationId: string, membershipId?: string, role?: string) {
    const scopedDealIds = await this.scopedDealIds(organizationId, membershipId, role);
    const deals = await this.prisma.deal.findMany({
      where: { organizationId, status: { not: "archived" }, ...(scopedDealIds ? { id: { in: scopedDealIds } } : {}) },
      include: { primaryCompany: true, tasks: true },
      orderBy: [{ priorityRank: "asc" }, { lastActivityAt: "desc" }]
    });
    return deals.map(mapDeal);
  }

  async getDeal(organizationId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, organizationId },
      include: { primaryCompany: true, tasks: true }
    });
    if (!deal) throw notFound("Deal not found");
    return mapDeal(deal);
  }

  async createDeal(input: { organizationId: string; title: string; primaryCompanyName?: string | null; ownerMembershipId: string }) {
    const company = input.primaryCompanyName
      ? await this.prisma.company.create({
          data: { organizationId: input.organizationId, name: input.primaryCompanyName, companyType: "other" }
        })
      : null;
    const deal = await this.prisma.deal.create({
      data: {
        organizationId: input.organizationId,
        title: input.title,
        stage: "prospect",
        ownerMembershipId: input.ownerMembershipId,
        primaryCompanyId: company?.id ?? null,
        lastActivityAt: new Date()
      },
      include: { primaryCompany: true, tasks: true }
    });
    await this.recordAudit({ organizationId: input.organizationId, actorMembershipId: input.ownerMembershipId, entityType: "deal", entityId: deal.id, dealId: deal.id, eventType: "deal.created", after: mapDeal(deal) });
    return mapDeal(deal);
  }

  async patchDeal(input: { organizationId: string; dealId: string; title?: string; primaryCompanyName?: string | null; staleFlag?: boolean }) {
    const data: Prisma.DealUpdateInput = { lastActivityAt: new Date() };
    if (input.title !== undefined) data.title = input.title;
    if (input.staleFlag !== undefined) data.staleFlag = input.staleFlag;
    if (input.primaryCompanyName !== undefined) {
      data.primaryCompany = input.primaryCompanyName
        ? { create: { organizationId: input.organizationId, name: input.primaryCompanyName, companyType: "other" } }
        : { disconnect: true };
    }
    const before = await this.prisma.deal.findFirst({ where: { id: input.dealId, organizationId: input.organizationId }, include: { primaryCompany: true, tasks: true } });
    if (!before) throw notFound("Deal not found");
    const deal = await this.prisma.deal.update({ where: { id: input.dealId }, data, include: { primaryCompany: true, tasks: true } });
    await this.recordAudit({ organizationId: input.organizationId, entityType: "deal", entityId: deal.id, dealId: deal.id, eventType: "deal.updated", before: mapDeal(before), after: mapDeal(deal) });
    return mapDeal(deal);
  }

  async moveDealStage(input: { organizationId: string; dealId: string; stage: DealStage; membershipId: string }) {
    const before = await this.prisma.deal.findFirst({ where: { id: input.dealId, organizationId: input.organizationId }, include: { primaryCompany: true, tasks: true } });
    if (!before) throw notFound("Deal not found");
    const deal = await this.prisma.deal.update({
      where: { id: input.dealId },
      data: { stage: input.stage, lastActivityAt: new Date() },
      include: { primaryCompany: true, tasks: true }
    });
    await this.recordAudit({ organizationId: input.organizationId, actorMembershipId: input.membershipId, entityType: "deal", entityId: deal.id, dealId: deal.id, eventType: "deal.stage_moved", before: mapDeal(before), after: mapDeal(deal) });
    return mapDeal(deal);
  }

  async archiveDeal(input: { organizationId: string; dealId: string; membershipId: string }) {
    const deal = await this.prisma.deal.update({
      where: { id: input.dealId, organizationId: input.organizationId },
      data: { status: "archived", archivedAt: new Date() },
      include: { primaryCompany: true, tasks: true }
    });
    await this.recordAudit({ organizationId: input.organizationId, actorMembershipId: input.membershipId, entityType: "deal", entityId: deal.id, dealId: deal.id, eventType: "deal.archived", after: mapDeal(deal) });
    return mapDeal(deal);
  }

  async listParticipants(organizationId: string, dealId: string, includeInternal = true) {
    const participants = await this.prisma.dealParticipant.findMany({
      where: { organizationId, dealId, status: "active", ...(includeInternal ? {} : { visibility: "shared_with_deal_participants" }) },
      orderBy: { createdAt: "asc" }
    });
    return Promise.all(participants.map((participant) => this.mapParticipant(participant)));
  }

  async addParticipant(input: { organizationId: string; dealId: string; name: string; company?: string | null; role: string; capabilities: string[]; membershipId?: string | null; actorMembershipId?: string | null }) {
    await this.assertDealBelongsToOrganization(input.organizationId, input.dealId);
    const company = input.company
      ? await this.prisma.company.create({ data: { organizationId: input.organizationId, name: input.company, companyType: "other" } })
      : null;
    const contact = await this.prisma.contact.create({
      data: { organizationId: input.organizationId, companyId: company?.id ?? null, contactType: input.role === "broker" ? "broker" : "other", name: input.name }
    });
    const participant = await this.prisma.dealParticipant.create({
      data: {
        organizationId: input.organizationId,
        dealId: input.dealId,
        subjectType: "contact",
        subjectId: contact.id,
        participantRole: input.role as ParticipantRole,
        visibility: "shared_with_deal_participants"
      }
    });
    await this.replaceParticipantCapabilities(input.organizationId, participant.id, input.capabilities);
    const mapped = await this.mapParticipant(participant);
    await this.recordAudit({ organizationId: input.organizationId, actorMembershipId: input.actorMembershipId ?? null, entityType: "deal_participant", entityId: participant.id, dealId: participant.dealId, eventType: "participant.added", after: mapped });
    return mapped;
  }

  async updateParticipant(input: { organizationId: string; dealId: string; participantId: string; visibility?: VisibilityDto; capabilities?: string[]; status?: "active" | "removed"; actorMembershipId?: string | null }) {
    const before = await this.prisma.dealParticipant.findFirst({ where: { id: input.participantId, organizationId: input.organizationId, dealId: input.dealId } });
    if (!before) throw notFound("Participant not found");
    const beforeMapped = await this.mapParticipant(before);
    const participant = await this.prisma.dealParticipant.update({
      where: { id: input.participantId, organizationId: input.organizationId, dealId: input.dealId },
      data: {
        ...(input.visibility ? { visibility: toDbVisibility(input.visibility) } : {}),
        ...(input.status ? { status: input.status === "removed" ? "archived" : "active" } : {})
      }
    });
    if (input.capabilities) await this.replaceParticipantCapabilities(input.organizationId, participant.id, input.capabilities);
    const mapped = await this.mapParticipant(participant);
    await this.recordAudit({ organizationId: input.organizationId, actorMembershipId: input.actorMembershipId ?? null, entityType: "deal_participant", entityId: participant.id, dealId: participant.dealId, eventType: "participant.updated", before: beforeMapped, after: mapped });
    return mapped;
  }

  async listMessagesForDeal(organizationId: string, dealId: string, includeInternal = true) {
    const messages = await this.prisma.message.findMany({
      where: { organizationId, dealId, ...(includeInternal ? {} : { visibility: "shared_with_deal_participants" }) },
      orderBy: { occurredAt: "desc" }
    });
    return messages.map(mapMessage);
  }

  async createInboundMessage(input: { organizationId: string; dealId: string | null; channelId?: string | null; channelType: "email" | "sms"; providerMessageId?: string | null; subject?: string | null; bodyText: string; sender?: string | null; recipient?: string | null; routingConfidence?: number | null; routingStatus: "routed" | "review_required" | "unrelated"; visibility: VisibilityDto; rawProviderPayload?: unknown }) {
    if (input.dealId) await this.assertDealBelongsToOrganization(input.organizationId, input.dealId);
    const message = await this.prisma.message.create({
      data: {
        organizationId: input.organizationId,
        dealId: input.dealId,
        channelId: input.channelId ?? null,
        channelType: input.channelType,
        direction: "inbound",
        providerMessageId: input.providerMessageId ?? null,
        subject: input.subject ?? null,
        bodyText: input.bodyText,
        occurredAt: new Date(),
        routingConfidence: input.routingConfidence ?? null,
        routingStatus: input.routingStatus,
        visibility: toDbVisibility(input.visibility)
      }
    });
    const participants = [
      input.sender ? { organizationId: input.organizationId, messageId: message.id, rawHandle: input.sender, participantRole: "from" as const } : null,
      input.recipient ? { organizationId: input.organizationId, messageId: message.id, rawHandle: input.recipient, participantRole: "to" as const } : null
    ].filter((participant): participant is { organizationId: string; messageId: string; rawHandle: string; participantRole: "from" | "to" } => Boolean(participant));
    if (participants.length > 0) await this.prisma.messageParticipant.createMany({ data: participants });
    const mapped = mapMessage(message);
    await this.recordAudit({ organizationId: input.organizationId, entityType: "message", entityId: message.id, dealId: message.dealId, eventType: "message.inbound_filed", after: mapped, metadata: { rawProviderPayload: input.rawProviderPayload ?? null } });
    return mapped;
  }

  async updateMessageRouting(input: { organizationId: string; messageId: string; dealId: string | null; routingStatus: "routed" | "review_required" | "unrelated" }) {
    const before = await this.prisma.message.findFirst({ where: { id: input.messageId, organizationId: input.organizationId } });
    if (!before) throw notFound("Message not found");
    const message = await this.prisma.message.update({
      where: { id: input.messageId, organizationId: input.organizationId },
      data: {
        dealId: input.dealId,
        routingStatus: input.routingStatus,
        routedAt: input.routingStatus === "routed" ? new Date() : null
      }
    });
    const mapped = mapMessage(message);
    await this.recordAudit({ organizationId: input.organizationId, entityType: "message", entityId: message.id, dealId: message.dealId, eventType: "message.routing_updated", before: mapMessage(before), after: mapped });
    return mapped;
  }

  async updateMessage(input: { organizationId: string; dealId: string; messageId: string; nextDealId?: string | null; visibility?: VisibilityDto; hidden?: boolean; redacted?: boolean }) {
    if (input.nextDealId) await this.assertDealBelongsToOrganization(input.organizationId, input.nextDealId);
    const before = await this.prisma.message.findFirst({ where: { id: input.messageId, organizationId: input.organizationId, dealId: input.dealId } });
    if (!before) throw notFound("Message not found");
    const message = await this.prisma.message.update({
      where: { id: input.messageId, organizationId: input.organizationId, dealId: input.dealId },
      data: {
        ...(input.nextDealId !== undefined ? { dealId: input.nextDealId } : {}),
        ...(input.visibility ? { visibility: toDbVisibility(input.visibility) } : {}),
        ...(input.hidden ? { messageStatus: "hidden" } : {}),
        ...(input.redacted ? { messageStatus: "redacted", bodyText: "[redacted]", redactedAt: new Date() } : {})
      }
    });
    const mapped = mapMessage(message);
    await this.recordAudit({ organizationId: input.organizationId, entityType: "message", entityId: message.id, dealId: message.dealId, eventType: "message.updated", before: mapMessage(before), after: mapped });
    return mapped;
  }

  async appendOutboundMessage(input: { organizationId: string; dealId: string; taskId: string; providerMessageId: string | null; messageStatus: "sent" | "failed"; subject: string; bodyText: string; rawProviderResponse?: unknown }) {
    const message = await this.prisma.message.create({
      data: {
        organizationId: input.organizationId,
        dealId: input.dealId,
        sourceTaskId: input.taskId,
        channelType: "email",
        direction: "outbound",
        messageStatus: input.messageStatus,
        providerMessageId: input.providerMessageId,
        subject: input.subject,
        bodyText: input.bodyText,
        occurredAt: new Date(),
        routingStatus: "routed",
        visibility: "shared_with_deal_participants"
      }
    });
    const mapped = mapMessage(message);
    await this.recordAudit({ organizationId: input.organizationId, entityType: "message", entityId: message.id, dealId: message.dealId, eventType: `outbound_send.${input.messageStatus}`, after: mapped, metadata: { rawProviderResponse: input.rawProviderResponse ?? null } });
    return mapped;
  }

  async listDocumentsForDeal(organizationId: string, dealId: string, includeInternal = true) {
    const documents = await this.prisma.document.findMany({
      where: { organizationId, dealId, status: "active", ...(includeInternal ? {} : { visibility: "shared_with_deal_participants" }) },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" }
    });
    return documents.map(mapDocument);
  }

  async createDocument(input: { organizationId: string; dealId: string | null; sourceMessageId?: string | null; title: string; documentType?: string; visibility: VisibilityDto; folder?: string | null; tags?: string[]; uploadedByMembershipId?: string | null; version?: DocumentVersionInput }) {
    if (input.dealId) await this.assertDealBelongsToOrganization(input.organizationId, input.dealId);
    const data: Prisma.DocumentUncheckedCreateInput = {
      organizationId: input.organizationId,
      dealId: input.dealId,
      sourceMessageId: input.sourceMessageId ?? null,
      uploadedByMembershipId: input.uploadedByMembershipId ?? null,
      title: input.title,
      documentType: (input.documentType ?? "unknown") as DocumentType,
      visibility: toDbVisibility(input.visibility),
      folder: input.folder ?? null,
      tags: (input.tags ?? []) as Prisma.InputJsonValue,
      ...(input.version
        ? {
            versions: {
              create: {
                organizationId: input.organizationId,
                storageKey: input.version.storageKey,
                filename: input.version.filename,
                mimeType: input.version.mimeType,
                fileSizeBytes: input.version.fileSizeBytes,
                checksum: input.version.checksum,
                versionNumber: 1,
                ocrStatus: "pending"
              }
            }
          }
        : {})
    };
    const document = await this.prisma.document.create({
      data,
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
    });
    const mapped = mapDocument(document);
    await this.recordAudit({ organizationId: input.organizationId, actorMembershipId: input.uploadedByMembershipId ?? null, entityType: "document", entityId: document.id, dealId: document.dealId, eventType: "document.created", after: mapped });
    return mapped;
  }

  async updateDocument(input: { organizationId: string; dealId: string; documentId: string; title?: string; documentType?: string; visibility?: VisibilityDto; folder?: string | null; tags?: string[] }) {
    const before = await this.prisma.document.findFirst({
      where: { id: input.documentId, organizationId: input.organizationId, dealId: input.dealId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
    });
    if (!before) throw notFound("Document not found");
    const data: Prisma.DocumentUncheckedUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.documentType !== undefined) data.documentType = input.documentType as DocumentType;
    if (input.visibility) data.visibility = toDbVisibility(input.visibility);
    if (input.folder !== undefined) data.folder = input.folder;
    if (input.tags !== undefined) data.tags = input.tags as Prisma.InputJsonValue;
    const document = await this.prisma.document.update({
      where: { id: input.documentId, organizationId: input.organizationId, dealId: input.dealId },
      data,
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
    });
    const mapped = mapDocument(document);
    await this.recordAudit({ organizationId: input.organizationId, entityType: "document", entityId: document.id, dealId: document.dealId, eventType: "document.updated", before: mapDocument(before), after: mapped });
    return mapped;
  }

  async archiveDocument(input: { organizationId: string; dealId: string; documentId: string }) {
    const document = await this.prisma.document.update({
      where: { id: input.documentId, organizationId: input.organizationId, dealId: input.dealId },
      data: { status: "archived", archivedAt: new Date() },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
    });
    return mapDocument(document);
  }

  async listTasksForDeal(organizationId: string, dealId: string) {
    const tasks = await this.prisma.task.findMany({ where: { organizationId, dealId }, orderBy: { createdAt: "asc" } });
    return tasks.map(mapTask);
  }

  async getTask(organizationId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, organizationId } });
    if (!task) throw notFound("Task not found");
    return mapTask(task);
  }

  async createTask(input: { organizationId: string; dealId: string; title: string; description?: string | null; route: TaskRoute; assignedToMembershipId?: string | null; payload?: unknown }) {
    await this.assertDealBelongsToOrganization(input.organizationId, input.dealId);
    const task = await this.prisma.task.create({
      data: {
        organizationId: input.organizationId,
        dealId: input.dealId,
        taskType: input.route === "va" ? "va_work" : "manual",
        title: input.title,
        description: input.description ?? null,
        route: input.route,
        assignedToMembershipId: input.assignedToMembershipId ?? null,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue
      }
    });
    return mapTask(task);
  }

  async updateTask(input: { organizationId: string; taskId: string; title?: string; status?: string; route?: TaskRoute; payload?: unknown; completedAt?: Date | null }) {
    const data: Prisma.TaskUncheckedUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.status !== undefined) data.status = input.status as TaskStatus;
    if (input.route !== undefined) data.route = input.route;
    if (input.payload !== undefined) data.payload = input.payload as Prisma.InputJsonValue;
    if (input.completedAt !== undefined) data.completedAt = input.completedAt;
    const task = await this.prisma.task.update({
      where: { id: input.taskId, organizationId: input.organizationId },
      data
    });
    return mapTask(task);
  }

  async setCurrentNextAction(input: { organizationId: string; dealId: string; taskId: string }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({ where: { organizationId: input.organizationId, dealId: input.dealId, isCurrentNextAction: true }, data: { isCurrentNextAction: false, currentNextActionKey: null } });
      const task = await tx.task.update({
        where: { id: input.taskId, organizationId: input.organizationId },
        data: { isCurrentNextAction: true, currentNextActionKey: `${input.dealId}:current-next-action` }
      });
      return mapTask(task);
    });
  }

  async listRoutingReviewItems(organizationId: string) {
    const items = await this.prisma.routingReviewItem.findMany({
      where: { organizationId, status: "open" },
      orderBy: { createdAt: "asc" }
    });
    return Promise.all(items.map((item) => this.mapRoutingReviewItem(item)));
  }

  async createRoutingReviewItem(input: { organizationId: string; messageId: string; suggestedDealId?: string | null; confidence: number }) {
    const item = await this.prisma.routingReviewItem.create({
      data: { organizationId: input.organizationId, messageId: input.messageId, suggestedDealId: input.suggestedDealId ?? null, confidence: input.confidence }
    });
    const mapped = await this.mapRoutingReviewItem(item);
    await this.recordAudit({ organizationId: input.organizationId, entityType: "routing_review_item", entityId: item.id, dealId: input.suggestedDealId ?? null, eventType: "routing_review.created", after: mapped });
    return mapped;
  }

  async resolveRoutingReviewItem(input: { organizationId: string; itemId: string; resolvedDealId: string | null; resolution: "assigned_to_deal" | "marked_unrelated" | "created_new_deal"; membershipId: string }) {
    const before = await this.prisma.routingReviewItem.findFirst({ where: { id: input.itemId, organizationId: input.organizationId } });
    if (!before) throw notFound("Routing review item not found");
    const item = await this.prisma.routingReviewItem.update({
      where: { id: input.itemId, organizationId: input.organizationId },
      data: {
        status: "resolved",
        resolvedDealId: input.resolvedDealId,
        resolution: input.resolution,
        resolvedByMembershipId: input.membershipId,
        resolvedAt: new Date()
      }
    });
    await this.prisma.message.updateMany({
      where: { id: item.messageId, organizationId: input.organizationId },
      data: { dealId: input.resolvedDealId, routingStatus: input.resolution === "marked_unrelated" ? "unrelated" : "routed" }
    });
    const mapped = await this.mapRoutingReviewItem(item);
    await this.recordAudit({ organizationId: input.organizationId, actorMembershipId: input.membershipId, entityType: "routing_review_item", entityId: item.id, dealId: input.resolvedDealId, eventType: "routing_review.resolved", before: await this.mapRoutingReviewItem(before), after: mapped });
    return mapped;
  }

  async listVaWorkItems(organizationId: string, membershipId?: string) {
    const items = await this.prisma.vaWorkItem.findMany({
      where: { organizationId, ...(membershipId ? { OR: [{ assignedToMembershipId: null }, { assignedToMembershipId: membershipId }] } : {}) },
      include: { task: { include: { deal: true } } },
      orderBy: { createdAt: "asc" }
    });
    return items.map(mapVaWorkItem);
  }

  async updateVaWorkItem(input: { organizationId: string; itemId: string; status: VaWorkStatus; assignedToMembershipId?: string | null; submittedPayload?: unknown }) {
    const taskStatusByVaStatus: Partial<Record<VaWorkStatus, TaskStatus>> = {
      in_progress: "in_progress",
      submitted: "waiting_approval",
      accepted: "completed",
      canceled: "canceled",
      sent_back: "deferred"
    };
    const item = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.vaWorkItem.update({
        where: { id: input.itemId, organizationId: input.organizationId },
        data: {
          status: input.status,
          ...(input.assignedToMembershipId !== undefined ? { assignedToMembershipId: input.assignedToMembershipId } : {}),
          ...(input.submittedPayload !== undefined ? { submittedPayload: input.submittedPayload as Prisma.InputJsonValue } : {}),
          ...(input.status === "submitted" ? { submittedAt: new Date() } : {})
        },
        include: { task: { include: { deal: true } } }
      });
      const taskStatus = taskStatusByVaStatus[input.status];
      if (taskStatus) {
        await tx.task.update({
          where: { id: updated.taskId, organizationId: input.organizationId },
          data: { status: taskStatus, ...(taskStatus === "completed" ? { completedAt: new Date() } : {}) }
        });
      }
      return updated;
    });
    return mapVaWorkItem(item);
  }

  async listDealActivity(organizationId: string, dealId: string, includeInternal = true) {
    const [auditEvents, approvals] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where: { organizationId, dealId, ...(includeInternal ? {} : { visibility: "external_activity" }) },
        orderBy: { createdAt: "desc" }
      }),
      includeInternal ? this.prisma.approvalEvent.findMany({ where: { organizationId, dealId }, orderBy: { createdAt: "desc" } }) : Promise.resolve([])
    ]);
    return [
      ...auditEvents.map((event) => ({ id: event.id, dealId: event.dealId, actor: event.actorType === "system" ? "System" : "User", action: event.eventType, summary: event.eventType, type: "Audit", createdAt: event.createdAt.toISOString() })),
      ...approvals.map((event) => ({ id: event.id, dealId: event.dealId, actor: "User", action: event.decision, summary: `${event.approvalType} ${event.decision}`, type: "Approval", createdAt: event.createdAt.toISOString() }))
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getOrganizationSettings(organizationId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId },
      include: { channels: { where: { status: "active" }, orderBy: { createdAt: "asc" } } }
    });
    if (!org) throw notFound("Organization not found");
    return mapOrganizationSettings(org);
  }

  async findOrganizationByChannelAddress(channelType: "email" | "sms", address: string) {
    const channels = await this.prisma.channel.findMany({
      where: { channelType, address, status: "active" },
      take: 2,
      select: { id: true, organizationId: true }
    });
    if (channels.length > 1) throw Object.assign(new Error("Inbound channel address is ambiguous"), { statusCode: 409 });
    const channel = channels[0];
    return channel ? { organizationId: channel.organizationId, channelId: channel.id } : null;
  }

  async updateOrganizationSettings(input: { organizationId: string; name?: string; routingConfidenceThreshold?: number }) {
    const org = await this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.routingConfidenceThreshold !== undefined ? { routingConfidenceThreshold: input.routingConfidenceThreshold } : {})
      },
      include: { channels: { where: { status: "active" }, orderBy: { createdAt: "asc" } } }
    });
    return mapOrganizationSettings(org);
  }

  async updateOrganizationChannel(input: { organizationId: string; channelId: string; mode?: string; status?: string }) {
    await this.prisma.channel.update({
      where: { id: input.channelId, organizationId: input.organizationId },
      data: {
        ...(input.mode ? { defaultEngagementMode: input.mode as EngagementMode } : {}),
        ...(input.status ? { status: input.status === "archived" ? "archived" : "active" } : {})
      }
    });
    return this.getOrganizationSettings(input.organizationId);
  }

  async previewRoutingThreshold(organizationId: string, threshold: number) {
    const [wouldEnterReview, wouldAutoRoute] = await Promise.all([
      this.prisma.message.count({ where: { organizationId, routingStatus: "routed", routingConfidence: { not: null, lt: threshold } } }),
      this.prisma.message.count({ where: { organizationId, routingStatus: "review_required", routingConfidence: { not: null, gte: threshold } } })
    ]);
    return { threshold, wouldEnterReview, wouldAutoRoute };
  }

  async listUsers(organizationId: string) {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" }
    });
    return memberships.map((membership) => ({
      id: membership.user.id,
      name: membership.user.displayName,
      email: membership.user.email,
      role: membership.role,
      status: membership.status,
      lastLoginAt: membership.user.lastLoginAt?.toISOString() ?? null
    }));
  }

  async inviteUser(input: { organizationId: string; email: string; name: string; role: "admin" | "am" | "va" | "broker" | "client" }) {
    const user = await this.prisma.user.create({
      data: {
        authProvider: "better-auth",
        authSubject: `invite:${input.email}`,
        email: input.email,
        displayName: input.name,
        status: "invited",
        memberships: { create: { organizationId: input.organizationId, role: input.role, status: "invited" } }
      },
      include: { memberships: true }
    });
    return { id: user.id, name: user.displayName, email: user.email, role: input.role, status: "invited", lastLoginAt: null };
  }

  async updateUser(input: { organizationId: string; userId: string; role?: "admin" | "am" | "va" | "broker" | "client"; status?: "active" | "disabled" }) {
    const membership = await this.prisma.organizationMembership.update({
      where: { organizationId_userId: { organizationId: input.organizationId, userId: input.userId } },
      data: { ...(input.role ? { role: input.role } : {}), ...(input.status ? { status: input.status } : {}) },
      include: { user: true }
    });
    if (input.status) await this.prisma.user.update({ where: { id: input.userId }, data: { status: input.status } });
    return { id: membership.user.id, name: membership.user.displayName, email: membership.user.email, role: membership.role, status: membership.status, lastLoginAt: membership.user.lastLoginAt?.toISOString() ?? null };
  }

  async resendUserInvitation(input: { organizationId: string; userId: string }) {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId: input.organizationId, userId: input.userId } },
      include: { user: true }
    });
    if (!membership) throw notFound("User not found");
    return { id: membership.user.id, name: membership.user.displayName, email: membership.user.email, role: membership.role, status: membership.status, lastLoginAt: membership.user.lastLoginAt?.toISOString() ?? null };
  }

  private async scopedDealIds(organizationId: string, membershipId?: string, role?: string): Promise<string[] | null> {
    if (!membershipId || !role || ["admin", "am", "va"].includes(role)) return null;
    const participants = await this.prisma.dealParticipant.findMany({
      where: { organizationId, subjectType: "membership", subjectId: membershipId, status: "active" },
      select: { id: true, dealId: true }
    });
    if (participants.length === 0) return [];
    const grants = await this.prisma.permissionGrant.findMany({
      where: {
        organizationId,
        scopeType: "deal",
        effect: "allow",
        revokedAt: null,
        capability: "deal.view",
        OR: [{ subjectId: membershipId }, { subjectId: { in: participants.map((participant) => participant.id) } }]
      },
      select: { scopeId: true }
    });
    const visibleDealIds = new Set(grants.map((grant) => grant.scopeId));
    return participants.map((participant) => participant.dealId).filter((dealId) => visibleDealIds.has(dealId));
  }

  private async mapParticipant(participant: Prisma.DealParticipantGetPayload<object>) {
    const [membership, contact, grants] = await Promise.all([
      participant.subjectType === "membership" ? this.prisma.organizationMembership.findUnique({ where: { id: participant.subjectId }, include: { user: true } }) : null,
      participant.subjectType === "contact" ? this.prisma.contact.findUnique({ where: { id: participant.subjectId }, include: { company: true } }) : null,
      this.prisma.permissionGrant.findMany({
        where: {
          organizationId: participant.organizationId,
          scopeType: "deal",
          scopeId: participant.dealId,
          revokedAt: null,
          OR: [{ subjectId: participant.subjectId }, { subjectId: participant.id }]
        }
      })
    ]);
    const name = membership?.user.displayName ?? contact?.name ?? participant.subjectId;
    return {
      id: participant.id,
      dealId: participant.dealId,
      subjectType: participant.subjectType === "membership" ? "membership" : "contact",
      subjectId: participant.subjectId,
      membershipId: participant.subjectType === "membership" ? participant.subjectId : null,
      contactId: participant.subjectType === "contact" ? participant.subjectId : null,
      name,
      company: contact?.company?.name ?? null,
      role: participant.participantRole,
      visibility: fromDbVisibility(participant.visibility),
      capabilities: grants.map((grant) => fromDbCapability(grant.capability)),
      status: participant.status === "active" ? "active" : "removed"
    };
  }

  private async mapRoutingReviewItem(item: RoutingReviewRow) {
    const [message, suggestedDeal] = await Promise.all([
      this.prisma.message.findUnique({ where: { id: item.messageId }, include: { participants: true } }),
      item.suggestedDealId ? this.prisma.deal.findUnique({ where: { id: item.suggestedDealId } }) : null
    ]);
    const sender = message?.participants.find((participant) => participant.participantRole === "from")?.rawHandle ?? "unknown";
    return {
      id: item.id,
      messageId: item.messageId,
      suggestedDealId: item.suggestedDealId,
      suggestedDealTitle: suggestedDeal?.title ?? null,
      confidence: item.confidence,
      sender,
      subject: message?.subject ?? null,
      preview: message?.bodyText.slice(0, 120) ?? "",
      ageLabel: "now",
      explanation: item.suggestedDealId ? "Subject or body matched a known deal, but confidence is below threshold." : "No confident deal match found.",
      status: item.status,
      resolution: item.resolution,
      resolvedDealId: item.resolvedDealId,
      resolvedAt: item.resolvedAt?.toISOString() ?? null
    };
  }

  private async replaceParticipantCapabilities(organizationId: string, participantId: string, capabilities: string[]) {
    await this.prisma.permissionGrant.updateMany({
      where: { organizationId, subjectId: participantId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    if (capabilities.length === 0) return;
    const participant = await this.prisma.dealParticipant.findUnique({ where: { id: participantId } });
    if (!participant) return;
    await this.prisma.permissionGrant.createMany({
      data: capabilities.map((capability) => ({
        organizationId,
        scopeType: "deal",
        scopeId: participant.dealId,
        subjectType: "participant",
        subjectId: participantId,
        capability: toDbCapability(capability),
        effect: "allow"
      }))
    });
  }

  private async assertDealBelongsToOrganization(organizationId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id: dealId, organizationId }, select: { id: true } });
    if (!deal) throw notFound("Deal not found");
  }

  private async recordAudit(input: { organizationId: string; actorMembershipId?: string | null; entityType: string; entityId: string; dealId?: string | null; eventType: string; before?: unknown; after?: unknown; metadata?: unknown }) {
    await this.prisma.auditEvent.create({
      data: {
        organizationId: input.organizationId,
        actorMembershipId: input.actorMembershipId ?? null,
        actorType: input.actorMembershipId ? "user" : "system",
        entityType: input.entityType,
        entityId: input.entityId,
        dealId: input.dealId ?? null,
        eventType: input.eventType,
        before: jsonOrNull(input.before),
        after: jsonOrNull(input.after),
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue
      }
    });
  }
}

function mapDeal(deal: DealRow) {
  const currentTask = deal.tasks.find((task) => task.isCurrentNextAction);
  return {
    id: deal.id,
    organizationId: deal.organizationId,
    title: deal.title,
    primaryCompanyName: deal.primaryCompany?.name ?? null,
    stage: deal.stage,
    status: deal.status === "archived" ? "archived" : deal.status,
    ownerInitials: "MR",
    staleFlag: deal.staleFlag,
    lastActivityAt: deal.lastActivityAt?.toISOString() ?? null,
    nextActionLabel: currentTask?.title ?? null,
    pendingApprovals: deal.tasks.filter((task) => task.status === "waiting_approval").length,
    capabilities: ["viewDeal", "moveDealStage", "approveOutboundSend"]
  };
}

function mapMessage(message: MessageRow) {
  return {
    id: message.id,
    dealId: message.dealId,
    channelType: message.channelType,
    direction: message.direction,
    messageStatus: message.messageStatus,
    providerMessageId: message.providerMessageId,
    subject: message.subject,
    preview: message.bodyText.slice(0, 120),
    bodyText: message.bodyText,
    occurredAt: message.occurredAt.toISOString(),
    visibility: fromDbVisibility(message.visibility),
    routingConfidence: message.routingConfidence,
    routingStatus: message.routingStatus
  };
}

function mapDocument(document: DocumentRow) {
  const [latest] = document.versions ?? [];
  return {
    id: document.id,
    dealId: document.dealId,
    title: document.title,
    documentType: document.documentType,
    classificationStatus: document.classificationStatus,
    latestVersion: latest ? `v${latest.versionNumber}` : "v1",
    visibility: fromDbVisibility(document.visibility),
    folder: document.folder,
    tags: Array.isArray(document.tags) ? document.tags.filter((tag): tag is string => typeof tag === "string") : []
  };
}

function mapTask(task: TaskRow) {
  return {
    id: task.id,
    dealId: task.dealId,
    title: task.title,
    description: task.description,
    status: task.status,
    route: task.route,
    isCurrentNextAction: task.isCurrentNextAction,
    payload: isRecord(task.payload) ? task.payload : {},
    dueAt: task.dueAt?.toISOString() ?? null
  };
}

function mapVaWorkItem(item: VaWorkItemRow) {
  return {
    id: item.id,
    taskId: item.taskId,
    dealId: item.dealId,
    title: item.task.title,
    dealTitle: item.task.deal.title,
    status: item.status,
    instructions: item.instructions,
    assignedTo: item.assignedToMembershipId,
    submittedPayload: isRecord(item.submittedPayload) ? item.submittedPayload : null,
    notes: null,
    sentBackReason: null,
    history: []
  };
}

function mapOrganizationSettings(org: Prisma.OrganizationGetPayload<{ include: { channels: true } }>) {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    routingConfidenceThreshold: org.routingConfidenceThreshold,
    channels: org.channels.map((channel) => ({ id: channel.id, type: channel.channelType, address: channel.address, provider: channel.provider, mode: channel.defaultEngagementMode, status: channel.status }))
  };
}

function toDbVisibility(visibility: VisibilityDto) {
  return visibility === "shared" ? "shared_with_deal_participants" : "internal";
}

function fromDbVisibility(visibility: string): VisibilityDto {
  return visibility === "shared_with_deal_participants" ? "shared" : "internal";
}

function toDbCapability(capability: string) {
  if (capability === "viewDeal") return "deal.view";
  if (capability === "viewMessages") return "message.view";
  if (capability === "viewDocuments") return "document.view";
  if (capability === "uploadDocuments") return "document.upload";
  return capability;
}

function fromDbCapability(capability: string) {
  if (capability === "deal.view") return "viewDeal";
  if (capability === "message.view") return "viewMessages";
  if (capability === "document.view") return "viewDocuments";
  if (capability === "document.upload") return "uploadDocuments";
  return capability;
}

function jsonOrNull(value: unknown) {
  return value === undefined || value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function notFound(message: string) {
  return Object.assign(new Error(message), { statusCode: 404 });
}
