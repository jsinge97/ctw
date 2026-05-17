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
    API_PORT: z.coerce.number().int().positive().default(3000),
    CTW_RUNTIME_MODE: z.enum(["demo", "test", "production"]).default("demo"),
    CTW_DB_MODE: z.enum(["memory", "prisma"]).default("memory"),
    CTW_JOBS_MODE: z.enum(["memory", "pgboss"]).default("memory"),
    CTW_PROVIDER_MODE: z.enum(["fake", "live"]).default("fake"),
    CTW_STORAGE_MODE: z.enum(["memory", "s3"]).default("memory"),
    CTW_ALLOW_DEMO_TOKENS: z.enum(["true", "false"]).default("true")
});
export const runtimeSafetySchema = z.object({
    CTW_RUNTIME_MODE: z.enum(["demo", "test", "production"]).default("demo"),
    CTW_DB_MODE: z.enum(["memory", "prisma"]).default("memory"),
    CTW_JOBS_MODE: z.enum(["memory", "pgboss"]).default("memory"),
    CTW_PROVIDER_MODE: z.enum(["fake", "live"]).default("fake"),
    CTW_STORAGE_MODE: z.enum(["memory", "s3"]).default("memory"),
    CTW_ALLOW_DEMO_TOKENS: z.enum(["true", "false"]).default("true")
});
export function loadEnv(source = process.env) {
    return envSchema.parse(source);
}
export function assertProductionRuntimeSafety(source = process.env) {
    const env = runtimeSafetySchema.parse(source);
    if (env.CTW_RUNTIME_MODE !== "production")
        return env;
    const violations = [
        env.CTW_DB_MODE !== "prisma" ? "CTW_DB_MODE must be prisma in production" : null,
        env.CTW_JOBS_MODE !== "pgboss" ? "CTW_JOBS_MODE must be pgboss in production" : null,
        env.CTW_PROVIDER_MODE !== "live" ? "CTW_PROVIDER_MODE must be live in production" : null,
        env.CTW_STORAGE_MODE !== "s3" ? "CTW_STORAGE_MODE must be s3 in production" : null,
        env.CTW_ALLOW_DEMO_TOKENS === "true" ? "CTW_ALLOW_DEMO_TOKENS must be false in production" : null
    ].filter((violation) => violation !== null);
    if (violations.length > 0)
        throw new Error(`Unsafe production runtime: ${violations.join("; ")}`);
    return env;
}
//# sourceMappingURL=env.js.map