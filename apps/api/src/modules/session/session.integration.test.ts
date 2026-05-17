import { afterEach, describe, expect, it } from "vitest";
import { sessionCookieHeader } from "@ctw/auth";
import { buildServer } from "../../server.js";
import { loginWithEmailPassword, resetDurableSessionLookupForTests, resolveSessionFromToken, setDurableSessionLookupForTests } from "./session.service.js";

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
  resetDurableSessionLookupForTests();
});

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

  it("resolves current session from a Better Auth session cookie", async () => {
    setDurableSessionLookupForTests(async (token) =>
      token === "seed-session-am"
        ? {
            userId: "user_am",
            email: "am@northgate.cre",
            displayName: "Maria Reyes",
            organizationId: "org_northgate",
            organizationName: "Northgate CRE",
            organizationSlug: "northgate",
            membershipId: "mem_am",
            role: "am"
          }
        : null
    );

    const app = await buildServer();
    const response = await app.inject({ method: "GET", url: "/v1/session/current", headers: { cookie: sessionCookieHeader("seed-session-am") } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ user: { email: "am@northgate.cre" }, activeOrganization: { id: "org_northgate" }, membership: { id: "mem_am", role: "am" } });
  });

  it("creates a demo-mode Better Auth cookie from login", async () => {
    const app = await buildServer();
    const login = await app.inject({ method: "POST", url: "/v1/session/login", payload: { email: "am@northgate.cre", password: "password" } });
    const cookie = login.headers["set-cookie"]?.toString();
    const current = await app.inject({ method: "GET", url: "/v1/session/current", headers: { cookie } });

    expect(login.statusCode).toBe(200);
    expect(cookie).toContain("better-auth.session_token=demo-session-am");
    expect(current.statusCode).toBe(200);
    expect(current.json()).toMatchObject({ membership: { role: "am" } });
  });

  it("rejects missing session token", async () => {
    const app = await buildServer();
    const response = await app.inject({ method: "GET", url: "/v1/session/current" });
    expect(response.statusCode).toBe(401);
  });

  it("rejects demo bearer tokens in production mode", () => {
    process.env = {
      ...savedEnv,
      CTW_RUNTIME_MODE: "production",
      CTW_DB_MODE: "prisma",
      CTW_JOBS_MODE: "pgboss",
      CTW_PROVIDER_MODE: "live",
      CTW_ALLOW_DEMO_TOKENS: "false"
    };

    expect(() => resolveSessionFromToken("am-token")).toThrow(/Demo bearer tokens are not allowed/);
  });

  it("does not allow temporary password login in production mode", async () => {
    process.env = {
      ...savedEnv,
      CTW_RUNTIME_MODE: "production",
      CTW_DB_MODE: "prisma",
      CTW_JOBS_MODE: "pgboss",
      CTW_PROVIDER_MODE: "live",
      CTW_ALLOW_DEMO_TOKENS: "false"
    };

    await expect(loginWithEmailPassword({ email: "am@northgate.cre", password: "password" })).rejects.toThrow(/Better Auth credential login is not configured/);
  });
});
