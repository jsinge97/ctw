import { describe, expect, it } from "vitest";
import { updateOrganizationSettings } from "./settings.service.js";

describe("settings service", () => {
  it("updates routing threshold", () => {
    expect(updateOrganizationSettings({ routingConfidenceThreshold: 0.75 }).routingConfidenceThreshold).toBe(0.75);
  });
});
