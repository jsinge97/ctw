import { describe, expect, it } from "vitest";
import type { CurrentSession, UserDto } from "@ctw/contracts";
import { canManageOrganizationSettings, canManageUsers, settingsHomeForSession } from "../../lib/api/adapters/session.js";
import { thresholdPreviewLabel } from "./organization-settings-screen.js";
import { roleChangePreview } from "./users-settings-screen.js";

const adminSession = {
  capabilities: ["viewSettingsUsers", "viewSettingsOrganization", "managePermissions", "manageOrganizationSettings"]
} as CurrentSession;
const amSession = { capabilities: ["viewSettingsUsers"] } as CurrentSession;
const user = { id: "user_1", name: "Maria", email: "maria@example.com", role: "am", status: "active", lastLoginAt: null } satisfies UserDto;

describe("settings feature helpers", () => {
  it("routes users to the settings surface their role can use", () => {
    expect(settingsHomeForSession(adminSession)).toBe("/settings/organization");
    expect(settingsHomeForSession(amSession)).toBe("/settings/users");
    expect(canManageUsers(amSession)).toBe(false);
    expect(canManageOrganizationSettings(adminSession)).toBe(true);
  });

  it("summarizes role and threshold impact before mutation", () => {
    expect(roleChangePreview(user, "admin")).toContain("AM to ADMIN");
    expect(thresholdPreviewLabel({ wouldEnterReview: 2, wouldAutoRoute: 1 })).toBe("2 routed messages would enter review; 1 review items would auto-route.");
  });
});
