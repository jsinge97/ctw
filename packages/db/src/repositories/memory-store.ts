export type MemoryRecord = { id: string; organizationId: string };

export class MemoryTable<T extends MemoryRecord> {
  readonly rows = new Map<string, T>();

  list(organizationId: string): T[] {
    return [...this.rows.values()].filter((row) => row.organizationId === organizationId);
  }

  get(id: string): T | undefined {
    return this.rows.get(id);
  }

  upsert(row: T): T {
    this.rows.set(row.id, row);
    return row;
  }

  update(id: string, patch: Partial<T>): T {
    const existing = this.rows.get(id);
    if (!existing) throw new Error(`Record not found: ${id}`);
    const next = { ...existing, ...patch };
    this.rows.set(id, next);
    return next;
  }
}

export type MemoryStore = {
  organizations: MemoryTable<MemoryRecord & { name: string; slug: string; routingConfidenceThreshold: number }>;
};

export function createMemoryStore(): MemoryStore {
  return {
    organizations: new MemoryTable()
  };
}
