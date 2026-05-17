import { GeneratedApiClient } from "@ctw/api-client";

export const api = new GeneratedApiClient({
  fetchImpl: async (input, init) => {
    const headers = new Headers(init?.headers);
    return fetch(input, { ...init, credentials: "include", headers });
  }
});
