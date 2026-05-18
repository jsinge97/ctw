import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "dist");
const port = Number(process.env.PORT ?? 3000);
const host = "0.0.0.0";
const apiBaseUrl = process.env.VITE_API_BASE_URL ?? process.env.API_BASE_URL;

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
  const url = new URL(request.url ?? "/", "http://localhost");
  if (shouldProxyToApi(url.pathname)) {
    proxyApiRequest(request, response, url);
    return;
  }

  const pathname = url.pathname;
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

function shouldProxyToApi(pathname) {
  return pathname.startsWith("/v1/") || pathname === "/readyz" || pathname === "/healthz";
}

async function proxyApiRequest(request, response, url) {
  if (!apiBaseUrl) {
    response.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "API base URL is not configured" }));
    return;
  }

  const targetUrl = new URL(`${url.pathname}${url.search}`, apiBaseUrl);
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request,
      duplex: "half",
      redirect: "manual"
    });

    const responseHeaders = Object.fromEntries(upstream.headers.entries());
    responseHeaders["cache-control"] = "no-store";
    response.writeHead(upstream.status, responseHeaders);
    if (upstream.body) {
      await upstream.body.pipeTo(
        new WritableStream({
          write(chunk) {
            response.write(chunk);
          },
          close() {
            response.end();
          },
          abort() {
            response.destroy();
          }
        })
      );
    } else {
      response.end();
    }
  } catch {
    response.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "API request failed" }));
  }
}

function resolveFile(candidate) {
  try {
    const stats = statSync(candidate);
    if (stats.isFile()) return candidate;
  } catch {
    // Fall through to SPA fallback.
  }
  return join(root, "index.html");
}
