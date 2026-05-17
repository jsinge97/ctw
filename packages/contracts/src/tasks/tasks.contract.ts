import { z } from "zod";
import { defineRoute } from "../common.js";
import { createTaskRequestSchema, taskDecisionRequestSchema, taskSchema } from "./tasks.schemas.js";
const dealParams = z.object({ dealId: z.string() });
const taskParams = z.object({ taskId: z.string() });
export const tasksContract = [
  defineRoute({ method: "GET", path: "/v1/deals/:dealId/tasks", summary: "List tasks", tags: ["tasks"], params: dealParams, response: z.array(taskSchema) }),
  defineRoute({ method: "POST", path: "/v1/deals/:dealId/tasks", summary: "Create task", tags: ["tasks"], params: dealParams, body: createTaskRequestSchema, response: taskSchema }),
  defineRoute({ method: "POST", path: "/v1/tasks/:taskId/approve", summary: "Approve task", tags: ["tasks"], params: taskParams, body: taskDecisionRequestSchema, response: taskSchema }),
  defineRoute({ method: "POST", path: "/v1/tasks/:taskId/reject", summary: "Reject task", tags: ["tasks"], params: taskParams, body: taskDecisionRequestSchema, response: taskSchema }),
  defineRoute({ method: "POST", path: "/v1/tasks/:taskId/defer", summary: "Defer task", tags: ["tasks"], params: taskParams, body: taskDecisionRequestSchema, response: taskSchema }),
  defineRoute({ method: "POST", path: "/v1/tasks/:taskId/route", summary: "Route task", tags: ["tasks"], params: taskParams, body: taskDecisionRequestSchema, response: taskSchema })
];
