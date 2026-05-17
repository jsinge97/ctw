import { afterEach, describe, expect, it } from "vitest";
import { getWorkflowProvider, resetWorkflowProviderForTests } from "./workflow-provider.js";
import { resolveSessionFromToken } from "./session/session.service.js";

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
  resetWorkflowProviderForTests();
});

function setProductionEnv(overrides: NodeJS.ProcessEnv = {}) {
  process.env = {
    ...savedEnv,
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ctw",
    APP_BASE_URL: "http://localhost:5173",
    BETTER_AUTH_SECRET: "super-secret",
    RESEND_API_KEY: "re_live_123",
    TWILIO_ACCOUNT_SID: "AClive123",
    TWILIO_AUTH_TOKEN: "twilio-token",
    STORAGE_ENDPOINT: "http://localhost:9000",
    STORAGE_BUCKET: "ctw",
    STORAGE_ACCESS_KEY_ID: "live-access-key",
    STORAGE_SECRET_ACCESS_KEY: "live-secret-key",
    CTW_RUNTIME_MODE: "production",
    CTW_DB_MODE: "prisma",
    CTW_JOBS_MODE: "pgboss",
    CTW_PROVIDER_MODE: "live",
    CTW_STORAGE_MODE: "s3",
    CTW_AUTH_MODE: "durable",
    CTW_AI_MODE: "live",
    CTW_ALLOW_DEMO_TOKENS: "false",
    OPENAI_API_KEY: "sk_live_123",
    ...overrides
  };
}

describe("workflow provider runtime guardrails", () => {
  it("rejects memory workflow mode in production", () => {
    setProductionEnv({ CTW_DB_MODE: "memory" });
    expect(() => getWorkflowProvider()).toThrow(/CTW_DB_MODE must be prisma/);
  });

  it("rejects fake providers in production", () => {
    setProductionEnv({ CTW_PROVIDER_MODE: "fake" });
    expect(() => getWorkflowProvider()).toThrow(/CTW_PROVIDER_MODE must be live/);
  });

  it("rejects memory store access when durable workflow mode is selected", () => {
    process.env = {
      ...savedEnv,
      CTW_RUNTIME_MODE: "demo",
      CTW_DB_MODE: "prisma",
      CTW_JOBS_MODE: "memory",
      CTW_PROVIDER_MODE: "fake",
      CTW_STORAGE_MODE: "memory",
      CTW_ALLOW_DEMO_TOKENS: "true"
    };
    expect(() => getWorkflowProvider().memory).toThrow(/Memory workflow provider is not available/);
  });

  it("rejects demo bearer tokens in production", () => {
    setProductionEnv();
    expect(() => resolveSessionFromToken("am-token")).toThrow(/Demo bearer tokens are not allowed/);
  });
});
