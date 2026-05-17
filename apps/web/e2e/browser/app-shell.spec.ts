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
});

test("internal review surfaces render in the browser", async ({ page }) => {
  await page.goto("/routing-review");
  await expect(page.getByRole("heading", { name: "Routing review" })).toBeVisible();
  await expect(page.getByText("41% confidence")).toBeVisible();

  await page.goto("/va");
  await expect(page.getByRole("heading", { name: "VA queue" })).toBeVisible();
  await expect(page.getByText("Pull estoppel cert").first()).toBeVisible();
});
