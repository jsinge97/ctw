import { randomUUID } from "node:crypto";

export function createRequestId(prefix = "req"): string {
  return `${prefix}_${randomUUID()}`;
}
