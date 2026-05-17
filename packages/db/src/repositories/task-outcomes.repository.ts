import { MemoryTable } from "./memory-store.js";

export type TaskOutcomeRecord = {
  id: string;
  organizationId: string;
  dealId: string;
  taskId: string;
  outcome: "accepted" | "edited" | "rejected" | "deferred" | "rerouted" | "completed";
  createdByMembershipId: string;
  createdAt: string;
};

export class TaskOutcomesRepository extends MemoryTable<TaskOutcomeRecord> {}
