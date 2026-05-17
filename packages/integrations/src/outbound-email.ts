import { createEmailProvider } from "./providers.js";

export type OutboundEmail = { to: string[]; subject: string } & ({ text: string; html?: string } | { html: string; text?: string });

export async function sendOutboundEmail(message: OutboundEmail) {
  return createEmailProvider().sendOutbound(message);
}
