import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "apps/web/e2e/browser",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: "pnpm db:migrate && pnpm --filter @ctw/testkit db:seed && pnpm --filter @ctw/api start",
      url: "http://127.0.0.1:3000/healthz",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://ctw:ctw@localhost:5432/ctw",
        CTW_RUNTIME_MODE: "demo",
        CTW_DB_MODE: "prisma",
        CTW_JOBS_MODE: "memory",
        CTW_PROVIDER_MODE: "fake",
        CTW_STORAGE_MODE: "memory",
        CTW_ALLOW_DEMO_TOKENS: "false"
      }
    },
    {
      command: "pnpm --filter @ctw/web dev",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    }
  ]
});
