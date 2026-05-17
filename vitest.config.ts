import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", "dist/**", "apps/web/e2e/**"]
  },
  resolve: {
    alias: {
      "@ctw/api-client": "/packages/api-client/src/index.ts",
      "@ctw/auth": "/packages/auth/src/index.ts",
      "@ctw/config": "/packages/config/src/index.ts",
      "@ctw/contracts": "/packages/contracts/src/index.ts",
      "@ctw/db": "/packages/db/src/index.ts",
      "@ctw/domain": "/packages/domain/src/index.ts",
      "@ctw/integrations": "/packages/integrations/src/index.ts",
      "@ctw/jobs": "/packages/jobs/src/index.ts",
      "@ctw/observability": "/packages/observability/src/index.ts",
      "@ctw/permissions": "/packages/permissions/src/index.ts",
      "@ctw/storage": "/packages/storage/src/index.ts",
      "@ctw/testkit": "/packages/testkit/src/index.ts"
    }
  }
}
);
