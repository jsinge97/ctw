import { expect, test } from "@playwright/test";

test("login reaches the deal kanban and opens a workspace", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("CTW 2.0")).toBeVisible();

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/deals$/);
  await expect(page.getByRole("heading", { name: "Deals" })).toBeVisible();
  await expect(page.getByText("Sutter Tower - Floor 14")).toBeVisible();
  await expect(page.getByText("Send LOI response")).toBeVisible();

  await page.getByText("Sutter Tower - Floor 14").click();
  await expect(page).toHaveURL(/\/deals\/deal_sutter$/);
  await expect(page.getByRole("heading", { name: "Sutter Tower - Floor 14" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();

  await page.getByRole("link", { name: "Messages" }).click();
  await expect(page).toHaveURL(/\/deals\/deal_sutter\/messages$/);
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();

  await page.getByRole("link", { name: "Documents" }).click();
  await expect(page).toHaveURL(/\/deals\/deal_sutter\/documents$/);
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();

  await page.getByRole("link", { name: "Tasks" }).click();
  await expect(page).toHaveURL(/\/deals\/deal_sutter\/tasks$/);
  await expect(page.getByLabel("Tasks")).toBeVisible();

  await page.getByRole("link", { name: "Participants" }).click();
  await expect(page).toHaveURL(/\/deals\/deal_sutter\/participants$/);
  await expect(page.getByLabel("Participants")).toBeVisible();

  await page.getByRole("link", { name: "Activity" }).click();
  await expect(page).toHaveURL(/\/deals\/deal_sutter\/activity$/);
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
});

test("internal review surfaces render in the browser", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/deals$/);

  await page.goto("/routing-review");
  await expect(page.getByRole("heading", { name: "Routing review" })).toBeVisible();
  await expect(page.getByText("41% confidence")).toBeVisible();

  await page.goto("/va");
  await expect(page.getByRole("heading", { name: "VA queue" })).toBeVisible();
  await expect(page.getByText("Pull estoppel cert").first()).toBeVisible();
});

test("shell search, notifications, and hover feedback are interactive", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/deals$/);

  await page.getByLabel("Search deals, contacts, documents").fill("Sutter");
  await expect(page.getByRole("link", { name: /Sutter Tower/ })).toBeVisible();

  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText(/routing review|va work/).first()).toBeVisible();
  await page.getByRole("button", { name: "Notifications" }).click();

  const signOutButton = page.getByRole("button", { name: "Sign out" });
  const before = await signOutButton.evaluate((element) => getComputedStyle(element).backgroundColor);
  await signOutButton.hover();
  const after = await signOutButton.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(after).not.toBe(before);
});
