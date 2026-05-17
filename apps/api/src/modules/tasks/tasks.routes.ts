import type { FastifyInstance } from "fastify";
import { createTask, decideTask, listTasks } from "./tasks.service.js";

export async function registerTasksRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/tasks", async (request) => listTasks(request.params.dealId));
  app.post<{ Params: { dealId: string }; Body: any }>("/v1/deals/:dealId/tasks", async (request) => createTask(request.params.dealId, request.body as any));
  app.post<{ Params: { taskId: string }; Body: any }>("/v1/tasks/:taskId/approve", async (request) => decideTask(request.params.taskId, "approve", request.body as any));
  app.post<{ Params: { taskId: string }; Body: any }>("/v1/tasks/:taskId/reject", async (request) => decideTask(request.params.taskId, "reject", request.body as any));
  app.post<{ Params: { taskId: string }; Body: any }>("/v1/tasks/:taskId/defer", async (request) => decideTask(request.params.taskId, "defer", request.body as any));
  app.post<{ Params: { taskId: string }; Body: any }>("/v1/tasks/:taskId/route", async (request) => decideTask(request.params.taskId, "route", request.body as any));
}
