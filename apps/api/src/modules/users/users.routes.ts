import type { FastifyInstance } from "fastify";
import { inviteUserRequestSchema, updateUserRequestSchema } from "@ctw/contracts";
import { parseBody } from "../validation.js";
import { inviteUser, listUsers, updateUser } from "./users.service.js";

export async function registerUsersRoutes(app: FastifyInstance) {
  app.get("/v1/users", async () => listUsers());
  app.post("/v1/users", async (request) => inviteUser(parseBody(inviteUserRequestSchema, request.body)));
  app.patch<{ Params: { userId: string } }>("/v1/users/:userId", async (request) => updateUser(request.params.userId, parseBody(updateUserRequestSchema, request.body)));
}
