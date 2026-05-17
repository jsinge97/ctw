export type OutboundSms = { to: string; text: string };

export async function sendOutboundSms(message: OutboundSms) {
  return { provider: "twilio" as const, providerMessageId: `sms_${message.to}_${Date.now()}` };
}
