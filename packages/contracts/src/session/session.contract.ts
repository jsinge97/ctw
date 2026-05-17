import { defineRoute, emptyObjectSchema } from "../common.js";
import { acceptInvitationRequestSchema, currentSessionSchema, loginRequestSchema, logoutResponseSchema } from "./session.schemas.js";

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
  }),
  defineRoute({
    method: "POST",
    path: "/v1/session/login",
    summary: "Create session",
    tags: ["session"],
    body: loginRequestSchema,
    query: emptyObjectSchema,
    response: currentSessionSchema
  }),
  defineRoute({
    method: "POST",
    path: "/v1/session/logout",
    summary: "Clear session",
    tags: ["session"],
    body: emptyObjectSchema,
    query: emptyObjectSchema,
    response: logoutResponseSchema
  })
];
