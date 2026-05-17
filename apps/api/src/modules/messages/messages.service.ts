import type { MessageDto, UpdateMessageRequest } from "@ctw/contracts";
import { getWorkflowProvider } from "../workflow-provider.js";

const workflow = getWorkflowProvider().memory;

export function listMessages(dealId: string): MessageDto[] {
  return workflow.messages.filter((message) => message.dealId === dealId);
}

export function updateMessage(messageId: string, input: UpdateMessageRequest): MessageDto {
  const message = workflow.messages.find((item) => item.id === messageId);
  if (!message) throw Object.assign(new Error("Message not found"), { statusCode: 404 });
  if (input.redacted) {
    message.bodyText = "[redacted]";
    message.messageStatus = "redacted";
  }
  if (input.hidden) message.messageStatus = "hidden";
  Object.assign(message, input);
  return message;
}
