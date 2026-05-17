import { describe, expect, it } from "vitest";
import { router } from "./router.js";

describe("router", () => {
  it("registers the primary app surfaces", () => {
    expect(Object.keys(router.routesByPath)).toEqual(expect.arrayContaining(["/", "/deals", "/deals/$dealId", "/deals/$dealId/messages", "/deals/$dealId/documents", "/deals/$dealId/tasks", "/deals/$dealId/participants", "/deals/$dealId/activity", "/login", "/routing-review", "/settings/organization", "/va"]));
  });
});
