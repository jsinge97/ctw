import { getPrismaClient, PrismaWorkflowRepository } from "@ctw/db";
import { assertProductionRuntimeSafety } from "@ctw/config";
import {
  activityEvents,
  deals,
  documents,
  messages,
  nextId,
  orgId,
  organizationSettings,
  participants,
  routingReviewItems,
  tasks,
  users,
  vaWorkItems
} from "./demo-store.js";

type MemoryWorkflowStore = {
  activityEvents: typeof activityEvents;
  deals: typeof deals;
  documents: typeof documents;
  messages: typeof messages;
  orgId: typeof orgId;
  organizationSettings: typeof organizationSettings;
  participants: typeof participants;
  routingReviewItems: typeof routingReviewItems;
  tasks: typeof tasks;
  users: typeof users;
  vaWorkItems: typeof vaWorkItems;
  nextId: typeof nextId;
};

export type RuntimeWorkflowProvider = {
  mode: "memory" | "prisma";
  prisma: PrismaWorkflowRepository | null;
  memory: MemoryWorkflowStore;
};

function buildMemoryWorkflowStore(): MemoryWorkflowStore {
  return {
    activityEvents,
    deals,
    documents,
    messages,
    orgId,
    organizationSettings,
    participants,
    routingReviewItems,
    tasks,
    users,
    vaWorkItems,
    nextId
  };
}

function assertMemoryWorkflowAccessAllowed(mode: "memory" | "prisma") {
  if (mode === "prisma") throw new Error("Memory workflow provider is not available when CTW_DB_MODE=prisma");
}

let provider: RuntimeWorkflowProvider | undefined;

export function getWorkflowProvider(): RuntimeWorkflowProvider {
  const runtimeEnv = assertProductionRuntimeSafety();
  const mode = runtimeEnv.CTW_DB_MODE === "prisma" ? "prisma" : "memory";
  if (runtimeEnv.CTW_RUNTIME_MODE === "production" && mode === "memory") throw new Error("Memory workflow provider is not allowed in production");
  provider ??= {
    mode,
    prisma: mode === "prisma" ? new PrismaWorkflowRepository(getPrismaClient()) : null,
    get memory() {
      assertMemoryWorkflowAccessAllowed(mode);
      return buildMemoryWorkflowStore();
    }
  };
  return provider;
}

export function resetWorkflowProviderForTests() {
  provider = undefined;
}
