import { assertProductionRuntimeSafety } from "@ctw/config";

export type OutboundEmail = { to: string[]; subject: string; text: string };

export async function sendOutboundEmail(message: OutboundEmail) {
  const runtimeEnv = assertProductionRuntimeSafety();
  if (runtimeEnv.CTW_PROVIDER_MODE === "live") throw new Error("Live Resend outbound provider is not implemented yet");
  return { provider: "resend" as const, providerMessageId: `email_${message.to.join("_")}_${Date.now()}` };
}
