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

export type RuntimeWorkflowProvider = {
  mode: "memory" | "prisma";
  prisma: PrismaWorkflowRepository | null;
  memory: {
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
};

let provider: RuntimeWorkflowProvider | undefined;

export function getWorkflowProvider(): RuntimeWorkflowProvider {
  const runtimeEnv = assertProductionRuntimeSafety();
  const mode = runtimeEnv.CTW_DB_MODE === "prisma" ? "prisma" : "memory";
  if (runtimeEnv.CTW_RUNTIME_MODE === "production" && mode === "memory") throw new Error("Memory workflow provider is not allowed in production");
  provider ??= {
    mode,
    prisma: mode === "prisma" ? new PrismaWorkflowRepository(getPrismaClient()) : null,
    memory: {
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
    }
  };
  return provider;
}

export function resetWorkflowProviderForTests() {
  provider = undefined;
}
