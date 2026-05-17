import { GeneratedApiClient } from "@ctw/api-client";

export function apiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? "";
}

export const api = new GeneratedApiClient({
  baseUrl: apiBaseUrl(),
  fetchImpl: async (input, init) => {
    const headers = new Headers(init?.headers);
    return fetch(input, { ...init, credentials: "include", headers });
  }
});
