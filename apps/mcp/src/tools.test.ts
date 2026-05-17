import { describe, expect, it } from "vitest";
import { buildCtwToolDefinitions } from "./tools.js";

describe("ctw tools", () => {
  it("maps mutating tools back to OpenAPI operations", () => {
    const tools = buildCtwToolDefinitions();
    expect(tools).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "ctw_create_deal", operation: { method: "post", path: "/v1/deals" } }),
      expect.objectContaining({ name: "ctw_move_deal_stage", operation: { method: "post", path: "/v1/deals/{dealId}/move-stage" } }),
      expect.objectContaining({ name: "ctw_update_message", operation: { method: "patch", path: "/v1/deals/{dealId}/messages/{messageId}" } }),
      expect.objectContaining({ name: "ctw_update_document", operation: { method: "patch", path: "/v1/deals/{dealId}/documents/{documentId}" } }),
      expect.objectContaining({ name: "ctw_archive_document", operation: { method: "post", path: "/v1/deals/{dealId}/documents/{documentId}/archive" } }),
      expect.objectContaining({ name: "ctw_resolve_routing_review", operation: { method: "post", path: "/v1/routing-review-items/{itemId}/resolve" } })
    ]));
  });

  it("marks read-only tools as read-only", () => {
    const readOnlyTools = buildCtwToolDefinitions().filter((tool) => tool.name.startsWith("ctw_list") || tool.name === "ctw_get_deal_workspace" || tool.name === "ctw_get_current_session");
    expect(readOnlyTools.length).toBeGreaterThan(0);
    expect(readOnlyTools.every((tool) => tool.annotations.readOnlyHint === true)).toBe(true);
  });

  it("marks archive document as destructive", () => {
    expect(buildCtwToolDefinitions().find((tool) => tool.name === "ctw_archive_document")?.annotations.destructiveHint).toBe(true);
  });
});
