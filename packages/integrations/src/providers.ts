import { assertProductionRuntimeSafety } from "@ctw/config";
import type { OutboundEmail } from "./outbound-email.js";
import type { OutboundSms } from "./outbound-sms.js";
import { normalizeResendInbound } from "./resend.js";
import { normalizeTwilioInbound } from "./twilio.js";

export type ProviderSendResult = {
  provider: "resend" | "twilio";
  providerMessageId: string | null;
  rawProviderResponse: unknown;
};

export type EmailProvider = {
  sendOutbound: (message: OutboundEmail) => Promise<ProviderSendResult>;
};

export type SmsProvider = {
  sendOutbound: (message: OutboundSms) => Promise<ProviderSendResult>;
};

export type InboundEmailNormalizer = typeof normalizeResendInbound;
export type InboundSmsNormalizer = typeof normalizeTwilioInbound;

export type ProviderBundle = {
  email: EmailProvider;
  sms: SmsProvider;
  inboundEmail: InboundEmailNormalizer;
  inboundSms: InboundSmsNormalizer;
};

export function createProviderBundle(source: NodeJS.ProcessEnv = process.env): ProviderBundle {
  return {
    email: createEmailProvider(source),
    sms: createSmsProvider(source),
    inboundEmail: normalizeResendInbound,
    inboundSms: normalizeTwilioInbound
  };
}

export function createEmailProvider(source: NodeJS.ProcessEnv = process.env): EmailProvider {
  const runtimeEnv = assertProductionRuntimeSafety(source);
  return runtimeEnv.CTW_PROVIDER_MODE === "live" ? createResendProvider(source) : createFakeEmailProvider();
}

export function createSmsProvider(source: NodeJS.ProcessEnv = process.env): SmsProvider {
  const runtimeEnv = assertProductionRuntimeSafety(source);
  return runtimeEnv.CTW_PROVIDER_MODE === "live" ? createTwilioProvider(source) : createFakeSmsProvider();
}

export function createFakeEmailProvider(): EmailProvider {
  return {
    async sendOutbound(message) {
      return { provider: "resend", providerMessageId: `email_${message.to.join("_")}_${Date.now()}`, rawProviderResponse: { mode: "fake" } };
    }
  };
}

export function createFakeSmsProvider(): SmsProvider {
  return {
    async sendOutbound(message) {
      return { provider: "twilio", providerMessageId: `sms_${message.to}_${Date.now()}`, rawProviderResponse: { mode: "fake" } };
    }
  };
}

export function createResendProvider(source: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = fetch): EmailProvider {
  const apiKey = required(source.RESEND_API_KEY, "RESEND_API_KEY");
  const from = required(source.RESEND_FROM_EMAIL, "RESEND_FROM_EMAIL");
  return {
    async sendOutbound(message) {
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: message.to, subject: message.subject, text: message.text })
      });
      const raw = await parseProviderResponse(response);
      if (!response.ok) throw new Error(`Resend send failed: ${response.status}`);
      return { provider: "resend", providerMessageId: providerIdFrom(raw), rawProviderResponse: raw };
    }
  };
}

export function createTwilioProvider(source: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = fetch): SmsProvider {
  const accountSid = required(source.TWILIO_ACCOUNT_SID, "TWILIO_ACCOUNT_SID");
  const authToken = required(source.TWILIO_AUTH_TOKEN, "TWILIO_AUTH_TOKEN");
  const from = required(source.TWILIO_FROM_NUMBER, "TWILIO_FROM_NUMBER");
  return {
    async sendOutbound(message) {
      const body = new URLSearchParams({ From: from, To: message.to, Body: message.text });
      const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "content-type": "application/x-www-form-urlencoded"
        },
        body
      });
      const raw = await parseProviderResponse(response);
      if (!response.ok) throw new Error(`Twilio send failed: ${response.status}`);
      return { provider: "twilio", providerMessageId: providerIdFrom(raw), rawProviderResponse: raw };
    }
  };
}

async function parseProviderResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function providerIdFrom(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const value = "id" in raw ? raw.id : "sid" in raw ? raw.sid : null;
  return typeof value === "string" ? value : null;
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required for live provider mode`);
  return value;
}
