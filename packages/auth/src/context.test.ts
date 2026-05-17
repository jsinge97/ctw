import { describe, expect, it } from "vitest";
import { configureBetterAuth, createSystemActor } from "./index.js";

describe("auth foundation", () => {
  it("creates system actor context", () => {
    expect(createSystemActor("req_1").membership.role).toBe("admin");
  });

  it("configures Better Auth wrapper", () => {
    expect(configureBetterAuth({ appBaseUrl: "http://localhost:5173", secret: "secret" })).toMatchObject({
      kind: "better-auth",
      hasSecret: true
    });
  });
});
