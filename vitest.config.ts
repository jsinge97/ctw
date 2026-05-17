import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", "dist/**", "apps/web/e2e/**"]
  },
  resolve: {
    alias: {
      "@ctw/api-client": `${root}packages/api-client/src/index.ts`,
      "@ctw/auth": `${root}packages/auth/src/index.ts`,
      "@ctw/config": `${root}packages/config/src/index.ts`,
      "@ctw/contracts": `${root}packages/contracts/src/index.ts`,
      "@ctw/db": `${root}packages/db/src/index.ts`,
      "@ctw/domain": `${root}packages/domain/src/index.ts`,
      "@ctw/integrations": `${root}packages/integrations/src/index.ts`,
      "@ctw/jobs": `${root}packages/jobs/src/index.ts`,
      "@ctw/observability": `${root}packages/observability/src/index.ts`,
      "@ctw/permissions": `${root}packages/permissions/src/index.ts`,
      "@ctw/storage": `${root}packages/storage/src/index.ts`,
      "@ctw/testkit": `${root}packages/testkit/src/index.ts`
    }
  }
}
);
