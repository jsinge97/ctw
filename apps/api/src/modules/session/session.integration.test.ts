import { afterEach, describe, expect, it } from "vitest";
import { sessionCookieHeader } from "@ctw/auth";
import { buildServer } from "../../server.js";
import { loginWithEmailPassword, resetDurableCredentialLookupForTests, resetDurableSessionLookupForTests, resolveSessionFromToken, setDurableCredentialLookupForTests, setDurableSessionLookupForTests } from "./session.service.js";

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
  resetDurableSessionLookupForTests();
  resetDurableCredentialLookupForTests();
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
      CTW_STORAGE_MODE: "s3",
      CTW_AUTH_MODE: "durable",
      CTW_AI_MODE: "live",
      CTW_ALLOW_DEMO_TOKENS: "false",
      OPENAI_API_KEY: "sk_live_123",
      RESEND_API_KEY: "re_live_123",
      TWILIO_ACCOUNT_SID: "AClive123",
      TWILIO_AUTH_TOKEN: "live-token",
      STORAGE_ACCESS_KEY_ID: "live-access-key",
      STORAGE_SECRET_ACCESS_KEY: "live-secret-key"
    };

    expect(() => resolveSessionFromToken("am-token")).toThrow(/Demo bearer tokens are not allowed/);
  });

  it("fails production safety when auth is not durable", async () => {
    process.env = {
      ...savedEnv,
      CTW_RUNTIME_MODE: "production",
      CTW_DB_MODE: "prisma",
      CTW_JOBS_MODE: "pgboss",
      CTW_PROVIDER_MODE: "live",
      CTW_STORAGE_MODE: "s3",
      CTW_AUTH_MODE: "demo",
      CTW_AI_MODE: "live",
      CTW_ALLOW_DEMO_TOKENS: "false",
      OPENAI_API_KEY: "sk_live_123",
      RESEND_API_KEY: "re_live_123",
      TWILIO_ACCOUNT_SID: "AClive123",
      TWILIO_AUTH_TOKEN: "live-token",
      STORAGE_ACCESS_KEY_ID: "live-access-key",
      STORAGE_SECRET_ACCESS_KEY: "live-secret-key"
    };

    await expect(loginWithEmailPassword({ email: "am@northgate.cre", password: "password" })).rejects.toThrow(/CTW_AUTH_MODE must be durable/);
  });

  it("uses durable credential login in production mode", async () => {
    process.env = {
      ...savedEnv,
      CTW_RUNTIME_MODE: "production",
      CTW_DB_MODE: "prisma",
      CTW_JOBS_MODE: "pgboss",
      CTW_PROVIDER_MODE: "live",
      CTW_STORAGE_MODE: "s3",
      CTW_AUTH_MODE: "durable",
      CTW_AI_MODE: "live",
      CTW_ALLOW_DEMO_TOKENS: "false",
      OPENAI_API_KEY: "sk_live_123",
      RESEND_API_KEY: "re_live_123",
      TWILIO_ACCOUNT_SID: "AClive123",
      TWILIO_AUTH_TOKEN: "live-token",
      STORAGE_ACCESS_KEY_ID: "live-access-key",
      STORAGE_SECRET_ACCESS_KEY: "live-secret-key"
    };
    setDurableCredentialLookupForTests(async ({ email, password }) => {
      if (email !== "am@northgate.cre" || password !== "secret-password") return null;
      return {
        token: "durable-session",
        session: {
          user: { id: "user_am", email, displayName: "Maria Reyes" },
          activeOrganization: { id: "org_northgate", name: "Northgate CRE", slug: "northgate" },
          membership: { id: "mem_am", role: "am" },
          capabilities: [],
          allowedSurfaces: ["/deals"],
          homeRoute: "/deals"
        }
      };
    });

    await expect(loginWithEmailPassword({ email: "am@northgate.cre", password: "password" })).rejects.toThrow(/Unauthorized/);
    await expect(loginWithEmailPassword({ email: "am@northgate.cre", password: "secret-password" })).resolves.toMatchObject({ token: "durable-session" });
  });
});
