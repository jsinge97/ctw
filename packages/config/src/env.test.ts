import { describe, expect, it } from "vitest";
import { assertProductionRuntimeSafety, loadEnv } from "./env.js";

const validEnv = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ctw",
  APP_BASE_URL: "http://localhost:5173",
  BETTER_AUTH_SECRET: "super-secret",
  RESEND_API_KEY: "re_live_123",
  RESEND_FROM_EMAIL: "deals@northgate.cre",
  TWILIO_ACCOUNT_SID: "AClive123",
  TWILIO_AUTH_TOKEN: "twilio-token",
  TWILIO_FROM_NUMBER: "+14155550188",
  STORAGE_ENDPOINT: "http://localhost:9000",
  STORAGE_BUCKET: "ctw",
  STORAGE_ACCESS_KEY_ID: "live-access-key",
  STORAGE_SECRET_ACCESS_KEY: "live-secret-key",
  OPENAI_API_KEY: "sk_live_123"
};

describe("loadEnv", () => {
  it("loads a valid environment", () => {
    expect(loadEnv(validEnv)).toMatchObject({
      API_PORT: 3000,
      CTW_ALLOW_DEMO_TOKENS: "true",
      CTW_DB_MODE: "memory",
      CTW_JOBS_MODE: "memory",
      CTW_PROVIDER_MODE: "fake",
      CTW_STORAGE_MODE: "memory",
      CTW_RUNTIME_MODE: "demo",
      STORAGE_BUCKET: "ctw",
      STORAGE_REGION: "us-east-1"
    });
  });

  it("rejects missing required variables", () => {
    const missingDatabaseUrl = { ...validEnv, DATABASE_URL: "" };
    expect(() => loadEnv(missingDatabaseUrl)).toThrow();
  });

  it("rejects production mode with demo-only runtime settings", () => {
    expect(() =>
      assertProductionRuntimeSafety({
        ...validEnv,
        CTW_RUNTIME_MODE: "production",
        CTW_DB_MODE: "memory",
        CTW_JOBS_MODE: "memory",
      CTW_PROVIDER_MODE: "fake",
      CTW_STORAGE_MODE: "memory",
      CTW_AUTH_MODE: "demo",
      CTW_AI_MODE: "fake",
      CTW_ALLOW_DEMO_TOKENS: "true"
      })
    ).toThrow(/CTW_DB_MODE must be prisma/);
  });

  it("accepts production mode only with durable runtime settings", () => {
    expect(
      assertProductionRuntimeSafety({
        ...validEnv,
        CTW_RUNTIME_MODE: "production",
        CTW_DB_MODE: "prisma",
        CTW_JOBS_MODE: "pgboss",
        CTW_PROVIDER_MODE: "live",
        CTW_STORAGE_MODE: "s3",
        CTW_AUTH_MODE: "durable",
        CTW_AI_MODE: "live",
        CTW_ALLOW_DEMO_TOKENS: "false"
      })
    ).toMatchObject({ CTW_RUNTIME_MODE: "production", CTW_DB_MODE: "prisma" });
  });
});
