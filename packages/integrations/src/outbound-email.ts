export type OutboundEmail = { to: string[]; subject: string; text: string };

export async function sendOutboundEmail(message: OutboundEmail) {
  return { provider: "resend" as const, providerMessageId: `email_${message.to.join("_")}_${Date.now()}` };
}
