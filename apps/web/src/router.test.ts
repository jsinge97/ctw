import { describe, expect, it } from "vitest";
import { router } from "./router.js";

describe("router", () => {
  it("registers the primary app surfaces", () => {
    expect(Object.keys(router.routesByPath)).toEqual(expect.arrayContaining(["/", "/deals", "/login", "/routing-review", "/settings/organization", "/va"]));
  });
});
