import { afterEach, describe, expect, it } from "vitest";
import { sendOutboundEmail } from "./outbound-email.js";
import { sendOutboundSms } from "./outbound-sms.js";

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
});

function setLiveProviderEnv() {
  process.env = {
    ...savedEnv,
    CTW_RUNTIME_MODE: "production",
    CTW_DB_MODE: "prisma",
    CTW_JOBS_MODE: "pgboss",
    CTW_PROVIDER_MODE: "live",
    CTW_ALLOW_DEMO_TOKENS: "false"
  };
}

describe("outbound provider guardrails", () => {
  it("does not fake Resend sends when provider mode is live", async () => {
    setLiveProviderEnv();
    await expect(sendOutboundEmail({ to: ["broker@halcyon.com"], subject: "LOI", text: "Draft" })).rejects.toThrow(/Live Resend outbound provider/);
  });

  it("does not fake Twilio sends when provider mode is live", async () => {
    setLiveProviderEnv();
    await expect(sendOutboundSms({ to: "+14155550188", text: "Draft" })).rejects.toThrow(/Live Twilio outbound provider/);
  });
});
