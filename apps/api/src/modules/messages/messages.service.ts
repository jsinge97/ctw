import type { MessageDto, UpdateMessageRequest } from "@ctw/contracts";
import { messages } from "../demo-store.js";

export function listMessages(dealId: string): MessageDto[] {
  return messages.filter((message) => message.dealId === dealId);
}

export function updateMessage(messageId: string, input: UpdateMessageRequest): MessageDto {
  const message = messages.find((item) => item.id === messageId);
  if (!message) throw Object.assign(new Error("Message not found"), { statusCode: 404 });
  if (input.redacted) message.bodyText = "[redacted]";
  Object.assign(message, input);
  return message;
}
