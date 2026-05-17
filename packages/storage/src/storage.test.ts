import { describe, expect, it, vi } from "vitest";
import { createStorage, MemoryStorage, S3CompatibleStorage } from "./storage.js";

function env(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    CTW_RUNTIME_MODE: "test",
    CTW_DB_MODE: "memory",
    CTW_JOBS_MODE: "memory",
    CTW_PROVIDER_MODE: "fake",
    CTW_STORAGE_MODE: "memory",
    CTW_AUTH_MODE: "demo",
    CTW_AI_MODE: "fake",
    CTW_ALLOW_DEMO_TOKENS: "true",
    ...overrides
  };
}

describe("storage", () => {
  it("stores objects in fake memory mode", async () => {
    const storage = new MemoryStorage();
    const object = { key: "org/deal/doc.txt", contentType: "text/plain", bytes: new TextEncoder().encode("hello") };

    await expect(storage.put(object)).resolves.toEqual(object);
    await expect(storage.get(object.key)).resolves.toEqual(object);
  });

  it("requires endpoint and bucket in S3 mode", () => {
    expect(() => createStorage(env({ CTW_STORAGE_MODE: "s3" }))).toThrow(/STORAGE_ENDPOINT is required/);
    expect(() => createStorage(env({ CTW_STORAGE_MODE: "s3", STORAGE_ENDPOINT: "http://localhost:9000" }))).toThrow(/STORAGE_BUCKET is required/);
    expect(() => createStorage(env({ CTW_STORAGE_MODE: "s3", STORAGE_ENDPOINT: "http://localhost:9000", STORAGE_BUCKET: "ctw" }))).toThrow(/STORAGE_ACCESS_KEY_ID is required/);
  });

  it("puts to S3-compatible storage with signed path-style requests", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    const storage = new S3CompatibleStorage("http://localhost:9000", "ctw", "access", "secret", "us-east-1", fetchMock as typeof fetch);

    await storage.put({ key: "org/deal/doc.txt", contentType: "text/plain", bytes: new TextEncoder().encode("hello") });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9000/ctw/org/deal/doc.txt",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: expect.stringContaining("AWS4-HMAC-SHA256") }),
        method: "PUT"
      })
    );
  });

  it("gets from S3-compatible storage with signed path-style requests", async () => {
    const bytes = new TextEncoder().encode("hello");
    const fetchMock = vi.fn(async () => new Response(bytes, { status: 200, headers: { "content-type": "text/plain" } }));
    const storage = new S3CompatibleStorage("http://localhost:9000", "ctw", "access", "secret", "us-east-1", fetchMock as typeof fetch);

    await expect(storage.get("org/deal/doc.txt")).resolves.toMatchObject({ key: "org/deal/doc.txt", contentType: "text/plain", bytes });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9000/ctw/org/deal/doc.txt",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: expect.stringContaining("AWS4-HMAC-SHA256") }),
        method: "GET"
      })
    );
  });
});
