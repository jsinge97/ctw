import { sanitizeAuditPayload } from "@ctw/domain";
import { ApprovalEventsRepository, AuditRepository, TaskOutcomesRepository, type ApprovalEventRecord, type AuditRecord, type TaskOutcomeRecord } from "@ctw/db";

export type AuditService = ReturnType<typeof createAuditService>;

export function createAuditService(repositories = {
  audit: new AuditRepository(),
  approvals: new ApprovalEventsRepository(),
  outcomes: new TaskOutcomesRepository()
}) {
  return {
    repositories,
    recordAuditEvent(event: Omit<AuditRecord, "id" | "createdAt">): AuditRecord {
      return repositories.audit.append({
        ...event,
        id: `audit_${repositories.audit.rows.size + 1}`,
        before: sanitizeAuditPayload(event.before),
        after: sanitizeAuditPayload(event.after),
        metadata: sanitizeAuditPayload(event.metadata),
        createdAt: new Date().toISOString()
      });
    },
    recordApprovalEvent(event: Omit<ApprovalEventRecord, "id" | "createdAt">): ApprovalEventRecord {
      return repositories.approvals.append({
        ...event,
        id: `approval_${repositories.approvals.rows.size + 1}`,
        createdAt: new Date().toISOString()
      });
    },
    recordTaskOutcome(outcome: Omit<TaskOutcomeRecord, "id" | "createdAt">): TaskOutcomeRecord {
      return repositories.outcomes.append({
        ...outcome,
        id: `outcome_${repositories.outcomes.rows.size + 1}`,
        createdAt: new Date().toISOString()
      });
    }
  };
}
