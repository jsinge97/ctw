import { createResendProvider } from "./providers.js";

const testRecipient = requiredEnv("RESEND_TEST_TO");
const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const subject = process.env.RESEND_TEST_SUBJECT ?? "Hello World";

try {
  const provider = createResendProvider({ ...process.env, RESEND_FROM_EMAIL: from });
  const result = await provider.sendOutbound({
    to: [testRecipient],
    subject,
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
    text: "Congrats on sending your first email!"
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        provider: result.provider,
        providerMessageId: result.providerMessageId
      },
      null,
      2
    )
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown Resend smoke failure";
  console.error(`Resend smoke failed: ${message}`);
  process.exitCode = 1;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the Resend smoke test`);
  return value;
}
