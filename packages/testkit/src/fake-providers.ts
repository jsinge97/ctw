export function createFakeEmailProvider() {
  const sent: Array<{ to: string[]; subject: string; text: string }> = [];
  return {
    sent,
    async send(message: { to: string[]; subject: string; text: string }) {
      sent.push(message);
      return { provider: "fake-email" as const, providerMessageId: `fake_email_${sent.length}` };
    }
  };
}

export function createFakeSmsProvider() {
  const sent: Array<{ to: string; text: string }> = [];
  return {
    sent,
    async send(message: { to: string; text: string }) {
      sent.push(message);
      return { provider: "fake-sms" as const, providerMessageId: `fake_sms_${sent.length}` };
    }
  };
}
