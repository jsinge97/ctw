import type { CurrentSession, MessageDto, UpdateMessageRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

export async function listMessages(dealId: string, session?: CurrentSession): Promise<MessageDto[]> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    const includeInternal = !session || ["admin", "am"].includes(session.membership.role);
    return workflow.prisma.listMessagesForDeal(session?.activeOrganization.id ?? "org_northgate", dealId, includeInternal) as Promise<MessageDto[]>;
  }
  const messages = workflow.memory.messages.filter((message) => message.dealId === dealId);
  if (session && !["admin", "am"].includes(session.membership.role)) return messages.filter((message) => message.visibility === "shared");
  return messages;
}

export async function updateMessage(dealId: string, messageId: string, input: UpdateMessageRequest, session?: CurrentSession): Promise<MessageDto> {
  const workflow = getWorkflowProvider();
  if (workflow.mode === "prisma" && workflow.prisma) {
    return workflow.prisma.updateMessage({
      organizationId: session?.activeOrganization.id ?? "org_northgate",
      dealId,
      messageId,
      ...(input.dealId !== undefined ? { nextDealId: input.dealId } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.hidden !== undefined ? { hidden: input.hidden } : {}),
      ...(input.redacted !== undefined ? { redacted: input.redacted } : {})
    }) as Promise<MessageDto>;
  }
  const message = workflow.memory.messages.find((item) => item.id === messageId && item.dealId === dealId);
  if (!message) throw Object.assign(new Error("Message not found"), { statusCode: 404 });
  if (input.redacted) {
    message.bodyText = "[redacted]";
    message.messageStatus = "redacted";
  }
  if (input.hidden) message.messageStatus = "hidden";
  Object.assign(message, input);
  return message;
}
