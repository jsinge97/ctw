import { Prisma, type PrismaClient } from "../generated/client/index.js";

export type WorkflowRepository = {
  listDeals: (organizationId: string) => Promise<unknown[]>;
  listMessagesForDeal: (organizationId: string, dealId: string) => Promise<unknown[]>;
  updateMessageRouting: (input: { organizationId: string; messageId: string; dealId: string | null; routingStatus: "routed" | "review_required" | "unrelated" }) => Promise<unknown>;
  listRoutingReviewItems: (organizationId: string) => Promise<unknown[]>;
  resolveRoutingReviewItem: (input: { organizationId: string; itemId: string; resolvedDealId: string | null; resolution: "assigned_to_deal" | "marked_unrelated" | "created_new_deal"; membershipId: string }) => Promise<unknown>;
  listVaWorkItems: (organizationId: string, membershipId?: string) => Promise<unknown[]>;
  updateVaWorkItem: (input: { organizationId: string; itemId: string; status: "queued" | "in_progress" | "blocked" | "submitted" | "accepted" | "rejected" | "canceled" | "sent_back"; assignedToMembershipId?: string | null; submittedPayload?: unknown }) => Promise<unknown>;
  appendOutboundMessage: (input: { organizationId: string; dealId: string; taskId: string; providerMessageId: string | null; messageStatus: "sent" | "failed"; subject: string; bodyText: string }) => Promise<unknown>;
};

export class PrismaWorkflowRepository implements WorkflowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listDeals(organizationId: string) {
    return this.prisma.deal.findMany({
      where: { organizationId, status: { not: "archived" } },
      include: { primaryCompany: true, tasks: { where: { isCurrentNextAction: true }, take: 1 } },
      orderBy: [{ priorityRank: "asc" }, { lastActivityAt: "desc" }]
    });
  }

  listMessagesForDeal(organizationId: string, dealId: string) {
    return this.prisma.message.findMany({
      where: { organizationId, dealId },
      orderBy: { occurredAt: "desc" }
    });
  }

  updateMessageRouting(input: { organizationId: string; messageId: string; dealId: string | null; routingStatus: "routed" | "review_required" | "unrelated" }) {
    return this.prisma.message.updateMany({
      where: { id: input.messageId, organizationId: input.organizationId },
      data: {
        dealId: input.dealId,
        routingStatus: input.routingStatus,
        routedAt: input.routingStatus === "routed" ? new Date() : null
      }
    });
  }

  listRoutingReviewItems(organizationId: string) {
    return this.prisma.routingReviewItem.findMany({
      where: { organizationId, status: "open" },
      orderBy: { createdAt: "asc" }
    });
  }

  resolveRoutingReviewItem(input: { organizationId: string; itemId: string; resolvedDealId: string | null; resolution: "assigned_to_deal" | "marked_unrelated" | "created_new_deal"; membershipId: string }) {
    return this.prisma.routingReviewItem.updateMany({
      where: { id: input.itemId, organizationId: input.organizationId },
      data: {
        status: "resolved",
        resolvedDealId: input.resolvedDealId,
        resolution: input.resolution,
        resolvedByMembershipId: input.membershipId,
        resolvedAt: new Date()
      }
    });
  }

  listVaWorkItems(organizationId: string, membershipId?: string) {
    return this.prisma.vaWorkItem.findMany({
      where: {
        organizationId,
        ...(membershipId ? { OR: [{ assignedToMembershipId: null }, { assignedToMembershipId: membershipId }] } : {})
      },
      orderBy: { createdAt: "asc" }
    });
  }

  updateVaWorkItem(input: { organizationId: string; itemId: string; status: "queued" | "in_progress" | "blocked" | "submitted" | "accepted" | "rejected" | "canceled" | "sent_back"; assignedToMembershipId?: string | null; submittedPayload?: unknown }) {
    return this.prisma.vaWorkItem.updateMany({
      where: { id: input.itemId, organizationId: input.organizationId },
      data: {
        status: input.status,
        ...(input.assignedToMembershipId !== undefined ? { assignedToMembershipId: input.assignedToMembershipId } : {}),
        ...(input.submittedPayload !== undefined ? { submittedPayload: input.submittedPayload as Prisma.InputJsonValue } : {}),
        ...(input.status === "submitted" ? { submittedAt: new Date() } : {})
      }
    });
  }

  appendOutboundMessage(input: { organizationId: string; dealId: string; taskId: string; providerMessageId: string | null; messageStatus: "sent" | "failed"; subject: string; bodyText: string }) {
    return this.prisma.message.create({
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
  }
}
