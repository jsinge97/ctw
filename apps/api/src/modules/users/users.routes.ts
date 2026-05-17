import type { FastifyInstance } from "fastify";
import { inviteUser, listUsers, updateUser } from "./users.service.js";

export async function registerUsersRoutes(app: FastifyInstance) {
  app.get("/v1/users", async () => listUsers());
  app.post<{ Body: any }>("/v1/users", async (request) => inviteUser(request.body as any));
  app.patch<{ Params: { userId: string }; Body: any }>("/v1/users/:userId", async (request) => updateUser(request.params.userId, request.body as any));
}
