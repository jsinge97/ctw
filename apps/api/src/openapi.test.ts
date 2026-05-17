import { describe, expect, it } from "vitest";
import { openApiDocument } from "./openapi.js";

describe("openapi document", () => {
  it("contains health and openapi routes", () => {
    expect(openApiDocument.openapi).toBe("3.1.0");
    expect(openApiDocument.paths["/healthz"]).toBeDefined();
    expect(openApiDocument.paths["/openapi.json"]).toBeDefined();
  });
});
