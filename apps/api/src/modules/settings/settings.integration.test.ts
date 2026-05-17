import { describe, expect, it } from "vitest";
import { updateOrganizationSettings } from "./settings.service.js";

describe("settings service", () => {
  it("updates routing threshold", async () => {
    await expect(updateOrganizationSettings({ routingConfidenceThreshold: 0.75 })).resolves.toMatchObject({ routingConfidenceThreshold: 0.75 });
  });
});
