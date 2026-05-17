import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

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
    expect(loadEnv(validEnv)).toMatchObject({ API_PORT: 3000, STORAGE_BUCKET: "ctw" });
  });

  it("rejects missing required variables", () => {
    const missingDatabaseUrl = { ...validEnv, DATABASE_URL: "" };
    expect(() => loadEnv(missingDatabaseUrl)).toThrow();
  });
});
