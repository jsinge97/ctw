import { describe, expect, it } from "vitest";
import { assertProductionRuntimeSafety, loadEnv } from "./env.js";

const validEnv = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ctw",
  APP_BASE_URL: "http://localhost:5173",
  BETTER_AUTH_SECRET: "super-secret",
  RESEND_API_KEY: "re_test",
  TWILIO_ACCOUNT_SID: "AC_test",
  TWILIO_AUTH_TOKEN: "twilio-token",
  STORAGE_ENDPOINT: "http://localhost:9000",
  STORAGE_BUCKET: "ctw"
};

describe("loadEnv", () => {
  it("loads a valid environment", () => {
    expect(loadEnv(validEnv)).toMatchObject({
      API_PORT: 3000,
      CTW_ALLOW_DEMO_TOKENS: "true",
      CTW_DB_MODE: "memory",
      CTW_JOBS_MODE: "memory",
      CTW_PROVIDER_MODE: "fake",
      CTW_RUNTIME_MODE: "demo",
      STORAGE_BUCKET: "ctw"
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
        CTW_ALLOW_DEMO_TOKENS: "false"
      })
    ).toMatchObject({ CTW_RUNTIME_MODE: "production", CTW_DB_MODE: "prisma" });
  });
});
