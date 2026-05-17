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

export class TaskOutcomesRepository extends MemoryTable<TaskOutcomeRecord> {
  append(row: TaskOutcomeRecord): TaskOutcomeRecord {
    if (this.rows.has(row.id)) throw new Error(`Task outcome already exists: ${row.id}`);
    this.rows.set(row.id, row);
    return row;
  }
}
