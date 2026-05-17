import { MemoryTable } from "./memory-store.js";
import { Prisma, type PrismaClient } from "../generated/client/index.js";

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

export class PrismaAuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(row: AuditRecord): Promise<AuditRecord> {
    const data = {
        id: row.id,
        organizationId: row.organizationId,
        dealId: row.dealId ?? null,
        actorType: row.actorType,
        eventType: row.eventType,
        entityType: row.entityType,
        entityId: row.entityId,
        before: row.before === undefined ? Prisma.JsonNull : row.before as Prisma.InputJsonValue,
        after: row.after === undefined ? Prisma.JsonNull : row.after as Prisma.InputJsonValue,
        metadata: (row.metadata ?? {}) as object,
        createdAt: row.createdAt
      };
    await this.prisma.auditEvent.create({ data });
    return row;
  }
}
