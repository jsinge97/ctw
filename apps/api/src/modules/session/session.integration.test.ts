import { describe, expect, it } from "vitest";
import { buildDemoSession } from "./session.service.js";

describe("session service", () => {
  it("returns role home route and capabilities", () => {
    const session = buildDemoSession("va");
    expect(session.homeRoute).toBe("/va");
    expect(session.allowedSurfaces).toContain("/va");
  });
});
