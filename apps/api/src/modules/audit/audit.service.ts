import { sanitizeAuditPayload } from "@ctw/domain";
import {
  ApprovalEventsRepository,
  AuditRepository,
  PrismaApprovalEventsRepository,
  PrismaAuditRepository,
  PrismaTaskOutcomesRepository,
  TaskOutcomesRepository,
  getPrismaClient,
  type ApprovalEventRecord,
  type AuditRecord,
  type TaskOutcomeRecord
} from "@ctw/db";
import { randomUUID } from "node:crypto";

export type AuditService = ReturnType<typeof createAuditService>;

type AppendRepository<T> = {
  append: (row: T) => T | Promise<T>;
};

type AuditRepositories = {
  audit: AppendRepository<AuditRecord>;
  approvals: AppendRepository<ApprovalEventRecord>;
  outcomes: AppendRepository<TaskOutcomeRecord>;
};

export function createMemoryAuditRepositories() {
  return {
  audit: new AuditRepository(),
  approvals: new ApprovalEventsRepository(),
  outcomes: new TaskOutcomesRepository()
  };
}

export function createPrismaAuditRepositories(): AuditRepositories {
  const prisma = getPrismaClient();
  return {
    audit: new PrismaAuditRepository(prisma),
    approvals: new PrismaApprovalEventsRepository(prisma),
    outcomes: new PrismaTaskOutcomesRepository(prisma)
  };
}

export function createAuditService(repositories: AuditRepositories = createPrismaAuditRepositories()) {
  return {
    repositories,
    async recordAuditEvent(event: Omit<AuditRecord, "id" | "createdAt">): Promise<AuditRecord> {
      return repositories.audit.append({
        ...event,
        id: `audit_${randomUUID()}`,
        before: sanitizeAuditPayload(event.before),
        after: sanitizeAuditPayload(event.after),
        metadata: sanitizeAuditPayload(event.metadata),
        createdAt: new Date().toISOString()
      });
    },
    async recordApprovalEvent(event: Omit<ApprovalEventRecord, "id" | "createdAt">): Promise<ApprovalEventRecord> {
      return repositories.approvals.append({
        ...event,
        id: `approval_${randomUUID()}`,
        createdAt: new Date().toISOString()
      });
    },
    async recordTaskOutcome(outcome: Omit<TaskOutcomeRecord, "id" | "createdAt">): Promise<TaskOutcomeRecord> {
      return repositories.outcomes.append({
        ...outcome,
        id: `outcome_${randomUUID()}`,
        createdAt: new Date().toISOString()
      });
    }
  };
}
