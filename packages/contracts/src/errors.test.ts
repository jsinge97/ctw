import { describe, expect, it } from "vitest";
import { apiErrorSchema, createApiError } from "./errors.js";

describe("apiErrorSchema", () => {
  it("validates the shared error envelope", () => {
    const error = createApiError("validation_failed", "Invalid input", "req_1", { field: "email" });
    expect(apiErrorSchema.parse(error)).toEqual(error);
  });
});
