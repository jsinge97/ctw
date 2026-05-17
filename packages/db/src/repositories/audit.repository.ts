import { MemoryTable } from "./memory-store.js";

export type AuditRecord = {
  id: string;
  organizationId: string;
  dealId?: string;
  actorType: "user" | "system";
  eventType: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  createdAt: string;
};

export class AuditRepository extends MemoryTable<AuditRecord> {
  append(row: AuditRecord): AuditRecord {
    if (this.rows.has(row.id)) throw new Error(`Audit event already exists: ${row.id}`);
    this.rows.set(row.id, row);
    return row;
  }

  listForDeal(organizationId: string, dealId: string): AuditRecord[] {
    return this.list(organizationId)
      .filter((event) => event.dealId === dealId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
