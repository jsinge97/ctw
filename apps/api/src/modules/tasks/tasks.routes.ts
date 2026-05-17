import type { FastifyInstance } from "fastify";
import { createTaskRequestSchema, taskDecisionRequestSchema } from "@ctw/contracts";
import { getRequiredSession } from "../authz.js";
import { parseBody } from "../validation.js";
import { createTask, decideTask, listTasks } from "./tasks.service.js";

export async function registerTasksRoutes(app: FastifyInstance) {
  app.get<{ Params: { dealId: string } }>("/v1/deals/:dealId/tasks", async (request) => listTasks(request.params.dealId, getRequiredSession(request)));
  app.post<{ Params: { dealId: string } }>("/v1/deals/:dealId/tasks", async (request) => createTask(request.params.dealId, parseBody(createTaskRequestSchema, request.body), getRequiredSession(request)));
  app.post<{ Params: { taskId: string } }>("/v1/tasks/:taskId/approve", async (request) => decideTask(request.params.taskId, getRequiredSession(request), "approve", parseBody(taskDecisionRequestSchema, request.body ?? {})));
  app.post<{ Params: { taskId: string } }>("/v1/tasks/:taskId/reject", async (request) => decideTask(request.params.taskId, getRequiredSession(request), "reject", parseBody(taskDecisionRequestSchema, request.body ?? {})));
  app.post<{ Params: { taskId: string } }>("/v1/tasks/:taskId/defer", async (request) => decideTask(request.params.taskId, getRequiredSession(request), "defer", parseBody(taskDecisionRequestSchema, request.body ?? {})));
  app.post<{ Params: { taskId: string } }>("/v1/tasks/:taskId/route", async (request) => decideTask(request.params.taskId, getRequiredSession(request), "route", parseBody(taskDecisionRequestSchema, request.body ?? {})));
  app.post<{ Params: { taskId: string } }>("/v1/tasks/:taskId/complete", async (request) => decideTask(request.params.taskId, getRequiredSession(request), "complete", parseBody(taskDecisionRequestSchema, request.body ?? {})));
}
