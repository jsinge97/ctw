import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve(import.meta.dirname, "../prisma/schema.prisma"), "utf8");

describe("Prisma schema", () => {
  it("contains all initial product entities", () => {
    for (const model of [
      "Organization",
      "User",
      "OrganizationMembership",
      "Contact",
      "Company",
      "Deal",
      "DealParticipant",
      "PermissionGrant",
      "Channel",
      "Message",
      "MessageParticipant",
      "Document",
      "DocumentVersion",
      "Task",
      "RoutingReviewItem",
      "VaWorkItem",
      "ApprovalEvent",
      "AuditEvent",
      "TaskOutcome"
    ]) {
      expect(schema).toContain(`model ${model}`);
    }
  });

  it("captures the important uniqueness constraints", () => {
    expect(schema).toContain("@@unique([authProvider, authSubject])");
    expect(schema).toContain("@@unique([organizationId, userId])");
    expect(schema).toContain("@@unique([documentId, versionNumber])");
  });
});
