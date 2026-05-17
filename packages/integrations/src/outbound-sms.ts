import { createSmsProvider } from "./providers.js";

export type OutboundSms = { to: string; text: string };

export async function sendOutboundSms(message: OutboundSms) {
  return createSmsProvider().sendOutbound(message);
}
