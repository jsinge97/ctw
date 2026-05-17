import { afterEach, describe, expect, it, vi } from "vitest";
import { createProviderBundle, createResendProvider, createTwilioProvider } from "./providers.js";

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
  vi.restoreAllMocks();
});

function baseEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...savedEnv,
    CTW_RUNTIME_MODE: "test",
    CTW_DB_MODE: "memory",
    CTW_JOBS_MODE: "memory",
    CTW_PROVIDER_MODE: "fake",
    CTW_ALLOW_DEMO_TOKENS: "true",
    ...overrides
  };
}

describe("provider bundle", () => {
  it("uses fake providers outside live mode", async () => {
    const providers = createProviderBundle(baseEnv());
    await expect(providers.email.sendOutbound({ to: ["broker@halcyon.com"], subject: "LOI", text: "Draft" })).resolves.toMatchObject({ provider: "resend", rawProviderResponse: { mode: "fake" } });
    await expect(providers.sms.sendOutbound({ to: "+14155550188", text: "Draft" })).resolves.toMatchObject({ provider: "twilio", rawProviderResponse: { mode: "fake" } });
  });

  it("requires live Resend and Twilio credentials", () => {
    const liveEnv = baseEnv({ CTW_PROVIDER_MODE: "live", RESEND_API_KEY: "" });
    expect(() => createProviderBundle(liveEnv)).toThrow(/RESEND_API_KEY is required/);
  });

  it("rejects placeholder live credentials", () => {
    expect(() => createResendProvider(baseEnv({ RESEND_API_KEY: "re_test", RESEND_FROM_EMAIL: "deals@northgate.cre" }))).toThrow(/RESEND_API_KEY must be a live credential/);
  });

  it("sends Resend mail through the live adapter", async () => {
    const sendMock = vi.fn(async () => ({ data: { id: "resend_msg_1" }, error: null, headers: {} }));
    const provider = createResendProvider(baseEnv({ RESEND_API_KEY: "re_live", RESEND_FROM_EMAIL: "deals@northgate.cre" }), () => ({ emails: { send: sendMock } }));

    await expect(provider.sendOutbound({ to: ["broker@halcyon.com"], subject: "LOI", html: "<p>Draft</p>", text: "Draft" })).resolves.toMatchObject({ providerMessageId: "resend_msg_1" });
    expect(sendMock).toHaveBeenCalledWith({ from: "deals@northgate.cre", to: ["broker@halcyon.com"], subject: "LOI", html: "<p>Draft</p>", text: "Draft" });
  });

  it("surfaces Resend SDK errors", async () => {
    const sendMock = vi.fn(async () => ({ data: null, error: { message: "invalid sender", name: "invalid_from_address" as const, statusCode: 422 }, headers: {} }));
    const provider = createResendProvider(baseEnv({ RESEND_API_KEY: "re_live", RESEND_FROM_EMAIL: "deals@northgate.cre" }), () => ({ emails: { send: sendMock } }));

    await expect(provider.sendOutbound({ to: ["broker@halcyon.com"], subject: "LOI", text: "Draft" })).rejects.toThrow(/invalid sender/);
  });

  it("sends Twilio SMS through the live adapter", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ sid: "SM123" }), { status: 200 }));
    const provider = createTwilioProvider(baseEnv({ TWILIO_ACCOUNT_SID: "AC123", TWILIO_AUTH_TOKEN: "token", TWILIO_FROM_NUMBER: "+14155550188" }), fetchMock as typeof fetch);

    await expect(provider.sendOutbound({ to: "+14155550199", text: "Draft" })).resolves.toMatchObject({ providerMessageId: "SM123" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json", expect.objectContaining({ method: "POST" }));
  });

  it("preserves raw inbound provider payloads", () => {
    const providers = createProviderBundle(baseEnv());
    const resendPayload = { from: "a@example.com", to: "deals@northgate.cre", subject: "401 Bryant", text: "Tour?", messageId: "email_1" };
    const twilioPayload = { From: "+14155550199", To: "+14155550188", Body: "Tour?", MessageSid: "SM123" };

    expect(providers.inboundEmail(resendPayload)).toMatchObject({ providerMessageId: "email_1", rawProviderPayload: { provider: "resend", messageId: "email_1" } });
    expect(providers.inboundSms(twilioPayload)).toMatchObject({ providerMessageId: "SM123", rawProviderPayload: { provider: "twilio", messageSid: "SM123" } });
  });
});
