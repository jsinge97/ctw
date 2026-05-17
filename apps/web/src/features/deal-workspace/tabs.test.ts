import { describe, expect, it } from "vitest";
import { groupDocumentsByType } from "./documents-tab.js";
import { sortMessages } from "./messages-tab.js";
import { groupParticipantsByRole } from "./participants-tab.js";
import { groupTasksByStatus } from "./tasks-tab.js";

describe("deal workspace tab helpers", () => {
  it("groups document rows by type", () => {
    expect(groupDocumentsByType([
      { id: "doc_1", dealId: "deal_1", title: "Lease.pdf", documentType: "lease", classificationStatus: "classified", latestVersion: "v1", visibility: "shared", folder: null, tags: [] },
      { id: "doc_2", dealId: "deal_1", title: "OM.pdf", documentType: "om", classificationStatus: "pending", latestVersion: "v1", visibility: "internal", folder: null, tags: [] }
    ])).toMatchObject({ lease: [{ id: "doc_1" }], om: [{ id: "doc_2" }] });
  });

  it("sorts newest messages first", () => {
    const sorted = sortMessages([
      { id: "msg_old", dealId: "deal_1", channelType: "email", direction: "inbound", messageStatus: "received", providerMessageId: null, subject: null, preview: "Old", bodyText: "Old", occurredAt: "2026-05-15T00:00:00.000Z", visibility: "shared", routingConfidence: null, routingStatus: "routed" },
      { id: "msg_new", dealId: "deal_1", channelType: "sms", direction: "inbound", messageStatus: "received", providerMessageId: null, subject: null, preview: "New", bodyText: "New", occurredAt: "2026-05-16T00:00:00.000Z", visibility: "internal", routingConfidence: 0.7, routingStatus: "review_required" }
    ]);
    expect(sorted.map((message) => message.id)).toEqual(["msg_new", "msg_old"]);
  });

  it("groups tasks and participants by operational bucket", () => {
    expect(groupTasksByStatus([
      { id: "task_1", dealId: "deal_1", title: "Review", description: null, status: "proposed", route: "self", isCurrentNextAction: true, payload: {}, dueAt: null }
    ])).toHaveProperty("proposed");
    expect(groupParticipantsByRole([
      { id: "part_1", dealId: "deal_1", subjectType: "contact", subjectId: "contact_1", membershipId: null, contactId: "contact_1", name: "Devon", company: "Halcyon", role: "broker", visibility: "shared", capabilities: ["viewDeal"], status: "active" }
    ])).toHaveProperty("broker");
  });
});
