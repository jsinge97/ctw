import { defineRoute, emptyObjectSchema } from "../common.js";
import { acceptInvitationRequestSchema, currentSessionSchema } from "./session.schemas.js";

export const sessionContract = [
  defineRoute({
    method: "GET",
    path: "/v1/session/current",
    summary: "Get current session",
    tags: ["session"],
    response: currentSessionSchema
  }),
  defineRoute({
    method: "POST",
    path: "/v1/session/accept-invitation",
    summary: "Accept invitation",
    tags: ["session"],
    body: acceptInvitationRequestSchema,
    query: emptyObjectSchema,
    response: currentSessionSchema
  })
];
