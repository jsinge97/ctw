import { MemoryTable } from "./memory-store.js";
import type { PrismaClient } from "../generated/client/index.js";

export type ApprovalEventRecord = {
  id: string;
  organizationId: string;
  dealId: string;
  taskId?: string;
  messageId?: string;
  approvalType: "stage_change" | "next_action" | "outbound_send" | "va_submission";
  decision: "approved" | "rejected" | "sent_back" | "canceled";
  decisionByMembershipId: string;
  decisionReason?: string;
  createdAt: string;
};

export class ApprovalEventsRepository extends MemoryTable<ApprovalEventRecord> {
  append(row: ApprovalEventRecord): ApprovalEventRecord {
    if (this.rows.has(row.id)) throw new Error(`Approval event already exists: ${row.id}`);
    this.rows.set(row.id, row);
    return row;
  }
}

export class PrismaApprovalEventsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(row: ApprovalEventRecord): Promise<ApprovalEventRecord> {
    const data = {
        id: row.id,
        organizationId: row.organizationId,
        dealId: row.dealId,
        taskId: row.taskId ?? null,
        messageId: row.messageId ?? null,
        documentId: null,
        approvalType: row.approvalType,
        decision: row.decision,
        decisionByMembershipId: row.decisionByMembershipId,
        decisionReason: row.decisionReason ?? null,
        createdAt: row.createdAt
      };
    await this.prisma.approvalEvent.create({ data });
    return row;
  }
}
