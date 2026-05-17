import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve("openapi.json");
const target = resolve("packages/api-client/src/generated/openapi.json");

mkdirSync(dirname(target), { recursive: true });
if (existsSync(source)) {
  copyFileSync(source, target);
} else {
  writeFileSync(target, "{}\n");
}
