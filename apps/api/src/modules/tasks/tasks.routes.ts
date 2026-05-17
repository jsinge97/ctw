import type { FastifyInstance } from "fastify";
import { createTaskRequestSchema, taskDecisionRequestSchema } from "@ctw/contracts";
import { parseBody } from "../validation.js";
import { createTask, decideTask, listTasks } from "./tasks.service.js";

export async function registerTasksRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/tasks", async (request) => listTasks(request.params.dealId));
  app.post<{ Params: { dealId: string } }>("/v1/deals/:dealId/tasks", async (request) => createTask(request.params.dealId, parseBody(createTaskRequestSchema, request.body)));
  app.post<{ Params: { taskId: string } }>("/v1/tasks/:taskId/approve", async (request) => decideTask(request.params.taskId, "approve", parseBody(taskDecisionRequestSchema, request.body ?? {})));
  app.post<{ Params: { taskId: string } }>("/v1/tasks/:taskId/reject", async (request) => decideTask(request.params.taskId, "reject", parseBody(taskDecisionRequestSchema, request.body ?? {})));
  app.post<{ Params: { taskId: string } }>("/v1/tasks/:taskId/defer", async (request) => decideTask(request.params.taskId, "defer", parseBody(taskDecisionRequestSchema, request.body ?? {})));
  app.post<{ Params: { taskId: string } }>("/v1/tasks/:taskId/route", async (request) => decideTask(request.params.taskId, "route", parseBody(taskDecisionRequestSchema, request.body ?? {})));
}
