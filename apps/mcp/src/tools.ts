import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import * as z from "zod/v4";
import { ApiInvoker } from "./api-invoker.js";
import { listOpenApiOperations, type HttpMethod } from "./openapi-adapter.js";

type ToolResultPayload = Record<string, unknown>;

export type CtwToolDefinition<TInput extends z.ZodRawShape> = {
  annotations: ToolAnnotations;
  description: string;
  inputSchema: TInput;
  name: string;
  operation?: {
    method: HttpMethod;
    path: string;
  };
  title: string;
  handler: (input: Record<string, unknown>, api: ApiInvoker) => Promise<unknown>;
};

const emptySchema = {};

export function buildCtwToolDefinitions(): Array<CtwToolDefinition<z.ZodRawShape>> {
  return [
    {
      name: "ctw_list_openapi_operations",
      title: "List OpenAPI Operations",
      description: "List the CTW API operations available for MCP tool adaptation.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
      handler: async () => ({
        operations: listOpenApiOperations().map((operation) => ({
          method: operation.method.toUpperCase(),
          path: operation.path,
          summary: operation.summary,
          tags: operation.tags
        }))
      })
    },
    {
      name: "ctw_list_deals",
      title: "List Deals",
      description: "List visible deals, optionally filtering by search text or stage.",
      inputSchema: {
        q: z.string().optional().describe("Case-insensitive text to match against title, company, or next action."),
        stage: z.enum(["prospect", "loi", "negotiation", "diligence", "close", "closed_won", "lost"]).optional()
      },
      operation: { method: "get", path: "/v1/deals" },
      annotations: { readOnlyHint: true, openWorldHint: false },
      handler: async (input, api) => {
        const q = optionalString(input.q);
        const stage = optionalString(input.stage);
        const deals = await api.invoke<Array<Record<string, unknown>>>({ method: "get", path: "/v1/deals" });
        const query = q?.trim().toLowerCase();
        return {
          deals: deals.filter((deal) => {
            if (stage && deal.stage !== stage) return false;
            if (!query) return true;
            return [deal.title, deal.primaryCompanyName, deal.nextActionLabel].some((value) => String(value ?? "").toLowerCase().includes(query));
          })
        };
      }
    },
    {
      name: "ctw_get_deal_workspace",
      title: "Get Deal Workspace",
      description: "Fetch a deal and its workspace lists: participants, messages, documents, tasks, and activity.",
      inputSchema: {
        dealId: z.string().min(1)
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
      handler: async (input, api) => {
        const dealId = requiredString(input.dealId, "dealId");
        const params = { dealId };
        const [deal, participants, messages, documents, tasks, activity] = await Promise.all([
          api.invoke({ method: "get", path: "/v1/deals/{dealId}", params }),
          api.invoke({ method: "get", path: "/v1/deals/{dealId}/participants", params }),
          api.invoke({ method: "get", path: "/v1/deals/{dealId}/messages", params }),
          api.invoke({ method: "get", path: "/v1/deals/{dealId}/documents", params }),
          api.invoke({ method: "get", path: "/v1/deals/{dealId}/tasks", params }),
          api.invoke({ method: "get", path: "/v1/deals/{dealId}/activity", params })
        ]);
        return { activity, deal, documents, messages, participants, tasks };
      }
    },
    {
      name: "ctw_create_deal",
      title: "Create Deal",
      description: "Create a new deal with title and optional primary company name.",
      inputSchema: {
        primaryCompanyName: z.string().optional(),
        title: z.string().min(1)
      },
      operation: { method: "post", path: "/v1/deals" },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
      handler: async (input, api) => {
        const primaryCompanyName = optionalString(input.primaryCompanyName);
        const title = requiredString(input.title, "title");
        return api.invoke({ method: "post", path: "/v1/deals", body: { ...(primaryCompanyName ? { primaryCompanyName } : {}), title } });
      }
    },
    {
      name: "ctw_move_deal_stage",
      title: "Move Deal Stage",
      description: "Move a deal to another kanban pipeline stage.",
      inputSchema: {
        dealId: z.string().min(1),
        stage: z.enum(["prospect", "loi", "negotiation", "diligence", "close", "closed_won", "lost"])
      },
      operation: { method: "post", path: "/v1/deals/{dealId}/move-stage" },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
      handler: async (input, api) => {
        const dealId = requiredString(input.dealId, "dealId");
        const stage = requiredString(input.stage, "stage");
        return api.invoke({ method: "post", path: "/v1/deals/{dealId}/move-stage", params: { dealId }, body: { stage } });
      }
    },
    {
      name: "ctw_create_task",
      title: "Create Task",
      description: "Create a task on a deal. Use route=va when work should enter the VA workflow.",
      inputSchema: {
        dealId: z.string().min(1),
        description: z.string().optional(),
        route: z.enum(["system", "va", "self"]).default("self"),
        title: z.string().min(1)
      },
      operation: { method: "post", path: "/v1/deals/{dealId}/tasks" },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
      handler: async (input, api) => {
        const dealId = requiredString(input.dealId, "dealId");
        const description = optionalString(input.description);
        const route = requiredString(input.route, "route");
        const title = requiredString(input.title, "title");
        return api.invoke({ method: "post", path: "/v1/deals/{dealId}/tasks", params: { dealId }, body: { ...(description ? { description } : {}), route, title } });
      }
    },
    {
      name: "ctw_decide_task",
      title: "Decide Task",
      description: "Approve, reject, defer, route, or complete a task.",
      inputSchema: {
        decision: z.enum(["approve", "reject", "defer", "route", "complete"]),
        editedTitle: z.string().optional(),
        reason: z.string().optional(),
        route: z.enum(["system", "va", "self"]).optional(),
        taskId: z.string().min(1)
      },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
      handler: async (input, api) => {
        const decision = requiredString(input.decision, "decision");
        const editedTitle = optionalString(input.editedTitle);
        const reason = optionalString(input.reason);
        const route = optionalString(input.route);
        const taskId = requiredString(input.taskId, "taskId");
        const path = taskDecisionPath(decision);
        return api.invoke({
          method: "post",
          path,
          params: { taskId },
          body: { ...(editedTitle ? { editedTitle } : {}), ...(reason ? { reason } : {}), ...(route ? { route } : {}) }
        });
      }
    },
    {
      name: "ctw_list_routing_review",
      title: "List Routing Review",
      description: "List low-confidence inbound messages that need a filing decision.",
      inputSchema: emptySchema,
      operation: { method: "get", path: "/v1/routing-review-items" },
      annotations: { readOnlyHint: true, openWorldHint: false },
      handler: async (_input, api) => ({ items: await api.invoke({ method: "get", path: "/v1/routing-review-items" }) })
    },
    {
      name: "ctw_resolve_routing_review",
      title: "Resolve Routing Review",
      description: "Assign a review item to a deal, create a new deal from it, or mark it unrelated.",
      inputSchema: {
        dealId: z.string().optional(),
        itemId: z.string().min(1),
        newDealTitle: z.string().optional(),
        resolution: z.enum(["assign", "create_deal", "unrelated"])
      },
      operation: { method: "post", path: "/v1/routing-review-items/{itemId}/resolve" },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
      handler: async (input, api) => {
        const dealId = optionalString(input.dealId);
        const itemId = requiredString(input.itemId, "itemId");
        const newDealTitle = optionalString(input.newDealTitle);
        const resolution = requiredString(input.resolution, "resolution");
        const body = resolution === "assign" ? { resolution, dealId } : resolution === "create_deal" ? { resolution, newDealTitle } : { resolution };
        return api.invoke({ method: "post", path: "/v1/routing-review-items/{itemId}/resolve", params: { itemId }, body });
      }
    },
    {
      name: "ctw_list_va_work",
      title: "List VA Work",
      description: "List VA work items and their current execution/review status.",
      inputSchema: emptySchema,
      operation: { method: "get", path: "/v1/va-work-items" },
      annotations: { readOnlyHint: true, openWorldHint: false },
      handler: async (_input, api) => ({ items: await api.invoke({ method: "get", path: "/v1/va-work-items" }) })
    },
    {
      name: "ctw_update_va_work",
      title: "Update VA Work",
      description: "Start, submit, accept, send back, or cancel a VA work item.",
      inputSchema: {
        decision: z.enum(["start", "submit", "accept", "send-back", "cancel"]),
        itemId: z.string().min(1),
        notes: z.string().optional(),
        reason: z.string().optional(),
        submittedPayload: z.record(z.string(), z.unknown()).optional()
      },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
      handler: async (input, api) => {
        const decision = requiredString(input.decision, "decision");
        const itemId = requiredString(input.itemId, "itemId");
        const notes = optionalString(input.notes);
        const reason = optionalString(input.reason);
        const submittedPayload = isRecord(input.submittedPayload) ? input.submittedPayload : undefined;
        const body = decision === "send-back" ? { reason: reason ?? "Needs revision", ...(notes ? { notes } : {}) } : { ...(notes ? { notes } : {}), ...(submittedPayload ? { submittedPayload } : {}) };
        return api.invoke({ method: "post", path: vaDecisionPath(decision), params: { itemId }, body });
      }
    }
  ];
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function requiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${fieldName} is required`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function taskDecisionPath(decision: string) {
  if (decision === "approve") return "/v1/tasks/{taskId}/approve";
  if (decision === "reject") return "/v1/tasks/{taskId}/reject";
  if (decision === "defer") return "/v1/tasks/{taskId}/defer";
  if (decision === "route") return "/v1/tasks/{taskId}/route";
  if (decision === "complete") return "/v1/tasks/{taskId}/complete";
  throw new Error(`Unsupported task decision: ${decision}`);
}

function vaDecisionPath(decision: string) {
  if (decision === "start") return "/v1/va-work-items/{itemId}/start";
  if (decision === "submit") return "/v1/va-work-items/{itemId}/submit";
  if (decision === "accept") return "/v1/va-work-items/{itemId}/accept";
  if (decision === "send-back") return "/v1/va-work-items/{itemId}/send-back";
  if (decision === "cancel") return "/v1/va-work-items/{itemId}/cancel";
  throw new Error(`Unsupported VA work decision: ${decision}`);
}

export function toToolResult(payload: unknown): CallToolResult {
  const structuredContent = normalizePayload(payload);
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent
  };
}

function normalizePayload(payload: unknown): ToolResultPayload {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) return payload as ToolResultPayload;
  return { result: payload };
}
