import { MemoryTable } from "./memory-store.js";
import type { PrismaClient } from "../generated/client/index.js";

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

export class PrismaTaskOutcomesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(row: TaskOutcomeRecord): Promise<TaskOutcomeRecord> {
    await this.prisma.taskOutcome.create({
      data: {
        id: row.id,
        organizationId: row.organizationId,
        dealId: row.dealId,
        taskId: row.taskId,
        outcome: row.outcome,
        createdByMembershipId: row.createdByMembershipId,
        createdAt: row.createdAt
      }
    });
    return row;
  }
}
