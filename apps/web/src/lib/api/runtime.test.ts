import { afterEach, describe, expect, it, vi } from "vitest";
import { api, apiBaseUrl } from "./runtime.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("API runtime", () => {
  it("defaults to same-origin API calls unless VITE_API_BASE_URL is set", () => {
    expect(apiBaseUrl()).toBe("");
  });

  it("uses cookie credentials instead of demo bearer tokens", async () => {
    const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push([input, init]);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    });
    globalThis.fetch = fetchMock;

    await api.postSessionlogout({});

    expect(fetchMock).toHaveBeenCalledWith(
      "/v1/session/logout",
      expect.objectContaining({
        credentials: "include",
        headers: expect.any(Headers)
      })
    );
    const [, init] = calls[0] ?? [];
    if (!init) throw new Error("missing fetch init");
    const headers = init.headers as Headers;
    expect(headers.has("authorization")).toBe(false);
  });
});
