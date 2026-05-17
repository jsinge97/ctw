import { z } from "zod";
import { defineRoute } from "../common.js";
import { messageSchema, updateMessageRequestSchema } from "./messages.schemas.js";

const dealParams = z.object({ dealId: z.string() });
const messageParams = z.object({ dealId: z.string(), messageId: z.string() });
export const messagesContract = [
  defineRoute({ method: "GET", path: "/v1/deals/:dealId/messages", summary: "List messages", tags: ["messages"], params: dealParams, response: z.array(messageSchema) }),
  defineRoute({ method: "PATCH", path: "/v1/deals/:dealId/messages/:messageId", summary: "Update message", tags: ["messages"], params: messageParams, body: updateMessageRequestSchema, response: messageSchema })
];
