import { describe, expect, it } from "vitest";
import { fillOpenApiPath, findOpenApiOperation, listOpenApiOperations } from "./openapi-adapter.js";

describe("openapi adapter", () => {
  it("lists CTW operations from the generated OpenAPI document", () => {
    expect(listOpenApiOperations()).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: "get", path: "/v1/deals" }),
      expect.objectContaining({ method: "post", path: "/v1/deals/{dealId}/tasks" }),
      expect.objectContaining({ method: "post", path: "/v1/routing-review-items/{itemId}/resolve" })
    ]));
  });

  it("finds a specific operation used by a tool", () => {
    expect(findOpenApiOperation("post", "/v1/deals/{dealId}/move-stage")).toEqual(expect.objectContaining({
      method: "post",
      path: "/v1/deals/{dealId}/move-stage"
    }));
  });

  it("fills OpenAPI path parameters", () => {
    expect(fillOpenApiPath("/v1/deals/{dealId}/tasks", { dealId: "deal a/b" })).toBe("/v1/deals/deal%20a%2Fb/tasks");
  });
});
