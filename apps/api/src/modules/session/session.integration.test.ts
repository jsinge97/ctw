import { describe, expect, it } from "vitest";
import { buildServer } from "../../server.js";
import { resolveSessionFromToken } from "./session.service.js";

describe("session service", () => {
  it("returns role home route and capabilities", () => {
    const session = resolveSessionFromToken("va-token");
    expect(session.homeRoute).toBe("/va");
    expect(session.allowedSurfaces).toContain("/va");
  });

  it("mounts current session route", async () => {
    const app = await buildServer();
    const response = await app.inject({ method: "GET", url: "/v1/session/current", headers: { authorization: "Bearer am-token" } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ membership: { role: "am" } });
  });

  it("rejects missing session token", async () => {
    const app = await buildServer();
    const response = await app.inject({ method: "GET", url: "/v1/session/current" });
    expect(response.statusCode).toBe(401);
  });
});
