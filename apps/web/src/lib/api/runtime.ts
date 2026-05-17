import { GeneratedApiClient } from "@ctw/api-client";

const demoToken = "am-token";

export const api = new GeneratedApiClient({
  fetchImpl: async (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("authorization", `Bearer ${demoToken}`);
    return fetch(input, { ...init, headers });
  }
});
