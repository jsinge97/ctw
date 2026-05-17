import { describe, expect, it } from "vitest";
import { isExternallyVisible, visibilityLabel } from "./visibility.js";

describe("visibility", () => {
  it("labels internal and shared states", () => {
    expect(visibilityLabel("internal")).toBe("Internal");
    expect(visibilityLabel("shared_with_deal_participants")).toBe("Shared");
  });

  it("separates external activity from raw internal audit", () => {
    expect(isExternallyVisible("external_activity")).toBe(true);
    expect(isExternallyVisible("internal")).toBe(false);
  });
});
