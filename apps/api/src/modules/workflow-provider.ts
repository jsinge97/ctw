import { getPrismaClient, PrismaWorkflowRepository } from "@ctw/db";
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
  provider ??= {
    mode: process.env.CTW_DB_MODE === "prisma" ? "prisma" : "memory",
    prisma: process.env.CTW_DB_MODE === "prisma" ? new PrismaWorkflowRepository(getPrismaClient()) : null,
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
