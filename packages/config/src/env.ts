import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_BASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(8),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_FROM_NUMBER: z.string().min(1),
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1).optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  STORAGE_REGION: z.string().min(1).default("us-east-1"),
  API_CORS_ORIGIN: z.string().min(1).optional(),
  SESSION_COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  SESSION_COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  CTW_RUNTIME_MODE: z.enum(["demo", "test", "production"]).default("demo"),
  CTW_DB_MODE: z.enum(["memory", "prisma"]).default("memory"),
  CTW_JOBS_MODE: z.enum(["memory", "pgboss"]).default("memory"),
  CTW_PROVIDER_MODE: z.enum(["fake", "live"]).default("fake"),
  CTW_STORAGE_MODE: z.enum(["memory", "s3"]).default("memory"),
  CTW_AUTH_MODE: z.enum(["demo", "durable"]).default("demo"),
  CTW_AI_MODE: z.enum(["fake", "live"]).default("fake"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.5"),
  CTW_ALLOW_DEMO_TOKENS: z.enum(["true", "false"]).default("true")
});

export type AppEnv = z.infer<typeof envSchema>;

export const runtimeSafetySchema = z.object({
  CTW_RUNTIME_MODE: z.enum(["demo", "test", "production"]).default("demo"),
  CTW_DB_MODE: z.enum(["memory", "prisma"]).default("memory"),
  CTW_JOBS_MODE: z.enum(["memory", "pgboss"]).default("memory"),
  CTW_PROVIDER_MODE: z.enum(["fake", "live"]).default("fake"),
  CTW_STORAGE_MODE: z.enum(["memory", "s3"]).default("memory"),
  CTW_AUTH_MODE: z.enum(["demo", "durable"]).default("demo"),
  CTW_AI_MODE: z.enum(["fake", "live"]).default("fake"),
  CTW_ALLOW_DEMO_TOKENS: z.enum(["true", "false"]).default("true")
});

export type RuntimeSafetyEnv = z.infer<typeof runtimeSafetySchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}

export function assertProductionRuntimeSafety(source: NodeJS.ProcessEnv = process.env): RuntimeSafetyEnv {
  const env = runtimeSafetySchema.parse(source);
  if (env.CTW_RUNTIME_MODE !== "production") return env;
  const violations = [
    env.CTW_DB_MODE !== "prisma" ? "CTW_DB_MODE must be prisma in production" : null,
    env.CTW_JOBS_MODE !== "pgboss" ? "CTW_JOBS_MODE must be pgboss in production" : null,
    env.CTW_PROVIDER_MODE !== "live" ? "CTW_PROVIDER_MODE must be live in production" : null,
    env.CTW_STORAGE_MODE !== "s3" ? "CTW_STORAGE_MODE must be s3 in production" : null,
    env.CTW_AUTH_MODE !== "durable" ? "CTW_AUTH_MODE must be durable in production" : null,
    env.CTW_AI_MODE !== "live" ? "CTW_AI_MODE must be live in production" : null,
    env.CTW_ALLOW_DEMO_TOKENS === "true" ? "CTW_ALLOW_DEMO_TOKENS must be false in production" : null,
    isPlaceholder(source.OPENAI_API_KEY) ? "OPENAI_API_KEY must be a live credential in production" : null,
    isPlaceholder(source.RESEND_API_KEY) ? "RESEND_API_KEY must be a live credential in production" : null,
    isPlaceholder(source.TWILIO_ACCOUNT_SID) ? "TWILIO_ACCOUNT_SID must be a live credential in production" : null,
    isPlaceholder(source.TWILIO_AUTH_TOKEN) ? "TWILIO_AUTH_TOKEN must be a live credential in production" : null,
    isPlaceholder(source.STORAGE_ACCESS_KEY_ID) ? "STORAGE_ACCESS_KEY_ID must be a live credential in production" : null,
    isPlaceholder(source.STORAGE_SECRET_ACCESS_KEY) ? "STORAGE_SECRET_ACCESS_KEY must be a live credential in production" : null
  ].filter((violation): violation is string => violation !== null);
  if (violations.length > 0) throw new Error(`Unsafe production runtime: ${violations.join("; ")}`);
  return env;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized.includes("replace") || normalized.includes("test") || normalized.includes("example");
}
