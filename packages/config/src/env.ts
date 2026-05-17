import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_BASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(8),
  RESEND_API_KEY: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_BUCKET: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(3000),
  CTW_RUNTIME_MODE: z.enum(["demo", "test", "production"]).default("demo"),
  CTW_DB_MODE: z.enum(["memory", "prisma"]).default("memory"),
  CTW_JOBS_MODE: z.enum(["memory", "pgboss"]).default("memory"),
  CTW_PROVIDER_MODE: z.enum(["fake", "live"]).default("fake"),
  CTW_ALLOW_DEMO_TOKENS: z.enum(["true", "false"]).default("true")
});

export type AppEnv = z.infer<typeof envSchema>;

export const runtimeSafetySchema = z.object({
  CTW_RUNTIME_MODE: z.enum(["demo", "test", "production"]).default("demo"),
  CTW_DB_MODE: z.enum(["memory", "prisma"]).default("memory"),
  CTW_JOBS_MODE: z.enum(["memory", "pgboss"]).default("memory"),
  CTW_PROVIDER_MODE: z.enum(["fake", "live"]).default("fake"),
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
    env.CTW_ALLOW_DEMO_TOKENS === "true" ? "CTW_ALLOW_DEMO_TOKENS must be false in production" : null
  ].filter((violation): violation is string => violation !== null);
  if (violations.length > 0) throw new Error(`Unsafe production runtime: ${violations.join("; ")}`);
  return env;
}
