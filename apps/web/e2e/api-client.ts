import { GeneratedApiClient } from "@ctw/api-client";
import { buildServer } from "../../api/src/server.js";

export async function createInjectedApiClient(token = "am-token") {
  const app = await buildServer();
  await app.ready();

  const client = new GeneratedApiClient({
    fetchImpl: async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      const parsed = new URL(url, "http://ctw.test");
      const headers = new Headers(init?.headers);
      if (!headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
      const response = await app.inject({
        method: init?.method ?? "GET",
        url: `${parsed.pathname}${parsed.search}`,
        headers: Object.fromEntries(headers.entries()),
        payload: typeof init?.body === "string" ? init.body : undefined
      });

      return new Response(response.payload, {
        status: response.statusCode,
        headers: { "content-type": response.headers["content-type"]?.toString() ?? "application/json" }
      });
    }
  });

  return {
    api: client,
    close: () => app.close()
  };
}
