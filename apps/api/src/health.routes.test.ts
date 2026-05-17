import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "./server.js";

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
});

describe("health routes", () => {
  it("reports readiness for a non-production memory runtime without auth", async () => {
    process.env = {
      ...savedEnv,
      CTW_RUNTIME_MODE: "demo",
      CTW_DB_MODE: "memory",
      CTW_JOBS_MODE: "memory",
      CTW_PROVIDER_MODE: "fake",
      CTW_STORAGE_MODE: "memory",
      CTW_AUTH_MODE: "demo",
      CTW_AI_MODE: "fake",
      CTW_ALLOW_DEMO_TOKENS: "true"
    };
    const app = await buildServer();
    try {
      const response = await app.inject({ method: "GET", url: "/readyz" });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ ok: true, database: "skipped", workflowMode: "memory", providerMode: "fake" });
    } finally {
      await app.close();
    }
  });

  it("fails readiness for unsafe production settings", async () => {
    process.env = {
      ...savedEnv,
      CTW_RUNTIME_MODE: "production",
      CTW_DB_MODE: "memory",
      CTW_JOBS_MODE: "memory",
      CTW_PROVIDER_MODE: "fake",
      CTW_STORAGE_MODE: "memory",
      CTW_AUTH_MODE: "demo",
      CTW_AI_MODE: "fake",
      CTW_ALLOW_DEMO_TOKENS: "true"
    };
    const app = await buildServer();
    try {
      const response = await app.inject({ method: "GET", url: "/readyz" });
      expect(response.statusCode).toBe(503);
      expect(response.json()).toMatchObject({ ok: false, error: "readiness check failed" });
    } finally {
      await app.close();
    }
  });
});
