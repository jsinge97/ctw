import { assertProductionRuntimeSafety } from "@ctw/config";
import { Resend } from "resend";
import type { CreateEmailOptions, CreateEmailResponse } from "resend";
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

export type ResendClient = {
  emails: {
    send: (payload: CreateEmailOptions) => Promise<CreateEmailResponse>;
  };
};

export type ResendClientFactory = (apiKey: string) => ResendClient;

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
    get email() {
      return createEmailProvider(source);
    },
    get sms() {
      return createSmsProvider(source);
    },
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

export function createResendProvider(source: NodeJS.ProcessEnv = process.env, clientFactory: ResendClientFactory = (apiKey) => new Resend(apiKey)): EmailProvider {
  const apiKey = required(source.RESEND_API_KEY, "RESEND_API_KEY");
  const from = required(source.RESEND_FROM_EMAIL, "RESEND_FROM_EMAIL");
  const client = clientFactory(apiKey);
  return {
    async sendOutbound(message) {
      const response = await client.emails.send(toResendEmailPayload(message, from));
      if (response.error) throw new Error(`Resend send failed: ${response.error.message}`);
      return { provider: "resend", providerMessageId: providerIdFrom(response), rawProviderResponse: response };
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
  const directValue = "id" in raw ? raw.id : "sid" in raw ? raw.sid : null;
  if (typeof directValue === "string") return directValue;
  const data = "data" in raw ? raw.data : null;
  if (!data || typeof data !== "object") return null;
  const nestedValue = "id" in data ? data.id : null;
  return typeof nestedValue === "string" ? nestedValue : null;
}

function toResendEmailPayload(message: OutboundEmail, from: string): CreateEmailOptions {
  const base = { from, to: message.to, subject: message.subject };
  if (message.html !== undefined && message.text !== undefined) return { ...base, html: message.html, text: message.text };
  if (message.html !== undefined) return { ...base, html: message.html };
  if (message.text !== undefined) return { ...base, text: message.text };
  throw new Error("Outbound email requires text or html content");
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required for live provider mode`);
  const normalized = value.toLowerCase();
  if (normalized.includes("replace") || normalized.includes("test") || normalized.includes("example")) throw new Error(`${name} must be a live credential`);
  return value;
}
