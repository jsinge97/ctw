import { z } from "zod";
export declare const envSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    APP_BASE_URL: z.ZodString;
    BETTER_AUTH_SECRET: z.ZodString;
    RESEND_API_KEY: z.ZodString;
    RESEND_FROM_EMAIL: z.ZodString;
    TWILIO_ACCOUNT_SID: z.ZodString;
    TWILIO_AUTH_TOKEN: z.ZodString;
    TWILIO_FROM_NUMBER: z.ZodString;
    STORAGE_ENDPOINT: z.ZodString;
    STORAGE_BUCKET: z.ZodString;
    API_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    CTW_RUNTIME_MODE: z.ZodDefault<z.ZodEnum<{
        demo: "demo";
        test: "test";
        production: "production";
    }>>;
    CTW_DB_MODE: z.ZodDefault<z.ZodEnum<{
        memory: "memory";
        prisma: "prisma";
    }>>;
    CTW_JOBS_MODE: z.ZodDefault<z.ZodEnum<{
        memory: "memory";
        pgboss: "pgboss";
    }>>;
    CTW_PROVIDER_MODE: z.ZodDefault<z.ZodEnum<{
        fake: "fake";
        live: "live";
    }>>;
    CTW_STORAGE_MODE: z.ZodDefault<z.ZodEnum<{
        memory: "memory";
        s3: "s3";
    }>>;
    CTW_ALLOW_DEMO_TOKENS: z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>;
}, z.core.$strip>;
export type AppEnv = z.infer<typeof envSchema>;
export declare const runtimeSafetySchema: z.ZodObject<{
    CTW_RUNTIME_MODE: z.ZodDefault<z.ZodEnum<{
        demo: "demo";
        test: "test";
        production: "production";
    }>>;
    CTW_DB_MODE: z.ZodDefault<z.ZodEnum<{
        memory: "memory";
        prisma: "prisma";
    }>>;
    CTW_JOBS_MODE: z.ZodDefault<z.ZodEnum<{
        memory: "memory";
        pgboss: "pgboss";
    }>>;
    CTW_PROVIDER_MODE: z.ZodDefault<z.ZodEnum<{
        fake: "fake";
        live: "live";
    }>>;
    CTW_STORAGE_MODE: z.ZodDefault<z.ZodEnum<{
        memory: "memory";
        s3: "s3";
    }>>;
    CTW_ALLOW_DEMO_TOKENS: z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>;
}, z.core.$strip>;
export type RuntimeSafetyEnv = z.infer<typeof runtimeSafetySchema>;
export declare function loadEnv(source?: NodeJS.ProcessEnv): AppEnv;
export declare function assertProductionRuntimeSafety(source?: NodeJS.ProcessEnv): RuntimeSafetyEnv;
