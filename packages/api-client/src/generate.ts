import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve("openapi.json");
const target = resolve("packages/api-client/src/generated/openapi.json");
const routesTarget = resolve("packages/api-client/src/generated/routes.ts");

mkdirSync(dirname(target), { recursive: true });
if (existsSync(source)) {
  copyFileSync(source, target);
} else {
  writeFileSync(target, "{}\n");
}

writeFileSync(routesTarget, `export const generatedRoutes = {
  currentSession: "/v1/session/current",
  acceptInvitation: "/v1/session/accept-invitation"
} as const;
`);
