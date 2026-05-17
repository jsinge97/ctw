import { expect, test } from "@playwright/test";
import { expectSignedIn, loginAs } from "./helpers.js";

test("admin can see seeded organization users and settings controls", async ({ page }) => {
  await loginAs(page, "admin@northgate.cre");

  await expectSignedIn(page, /\/settings\/organization$/);
  await expect(page.getByRole("heading", { level: 1, name: "Organization settings" })).toBeVisible();
  await expect(page.getByLabel("Routing confidence threshold")).toHaveValue("0.8");

  await page.goto("/settings/users");
  await expect(page.getByRole("heading", { name: "User settings" })).toBeVisible();
  await expect(page.getByText("admin@northgate.cre")).toBeVisible();
  await expect(page.getByText("broker@halcyon.com")).toBeVisible();
  await expect(page.getByRole("button", { name: "Invite" })).toBeVisible();
});

test("broker sees the permission-limited deal portal", async ({ page }) => {
  await loginAs(page, "broker@halcyon.com");

  await expectSignedIn(page, /\/deals$/);
  await expect(page.getByText("Sutter Tower - Floor 14")).toBeVisible();
  await expect(page.getByText("401 Bryant - 12k sf office sublease")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Routing review" })).toHaveCount(0);

  await page.getByText("Sutter Tower - Floor 14").click();
  await expect(page.getByRole("heading", { name: "Sutter Tower - Floor 14" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Documents" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Messages" })).toHaveCount(0);
});

test("client sees only the deal granted to that client membership", async ({ page }) => {
  await loginAs(page, "client@greylock.com");

  await expectSignedIn(page, /\/deals$/);
  await expect(page.getByText("401 Bryant - 12k sf office sublease")).toBeVisible();
  await expect(page.getByText("Sutter Tower - Floor 14")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Routing review" })).toHaveCount(0);
});

test("VA lands on the queue without broader deal operations", async ({ page }) => {
  await loginAs(page, "va@northgate.cre");

  await expectSignedIn(page, /\/va$/);
  await expect(page.getByRole("heading", { name: "VA queue" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Routing review" })).toHaveCount(0);
});
