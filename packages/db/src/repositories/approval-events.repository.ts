import { MemoryTable } from "./memory-store.js";

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

export class ApprovalEventsRepository extends MemoryTable<ApprovalEventRecord> {}
