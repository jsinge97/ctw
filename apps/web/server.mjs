import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "dist");
const port = Number(process.env.PORT ?? 3000);
const host = "0.0.0.0";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"]
]);

createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const requestedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(root, requestedPath === "/" ? "index.html" : requestedPath);
  const filePath = resolveFile(candidate);

  response.setHeader("cache-control", filePath.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable");
  response.setHeader("content-type", contentTypes.get(extname(filePath)) ?? "application/octet-stream");
  createReadStream(filePath)
    .on("error", () => {
      response.writeHead(500);
      response.end("Internal server error");
    })
    .pipe(response);
}).listen(port, host, () => {
  console.log(`CTW web server listening on http://${host}:${port}`);
});

function resolveFile(candidate) {
  try {
    const stats = statSync(candidate);
    if (stats.isFile()) return candidate;
  } catch {
    // Fall through to SPA fallback.
  }
  return join(root, "index.html");
}
