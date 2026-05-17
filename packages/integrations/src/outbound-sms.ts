import { assertProductionRuntimeSafety } from "@ctw/config";

export type OutboundSms = { to: string; text: string };

export async function sendOutboundSms(message: OutboundSms) {
  const runtimeEnv = assertProductionRuntimeSafety();
  if (runtimeEnv.CTW_PROVIDER_MODE === "live") throw new Error("Live Twilio outbound provider is not implemented yet");
  return { provider: "twilio" as const, providerMessageId: `sms_${message.to}_${Date.now()}` };
}
