import { expect, test } from "@playwright/test";
import { apiJson, expectSignedIn, loginAs } from "./helpers.js";

type RoutingReviewItemDto = { id: string; confidence: number; status: string; suggestedDealId: string | null };
type OrganizationSettingsDto = { routingConfidenceThreshold: number };

test("AM can inspect low-confidence routing and admin threshold changes affect review behavior", async ({ page }) => {
  await loginAs(page);
  await expectSignedIn(page, /\/deals$/);

  const webhookResponse = await apiJson<{ messageId: string; reviewItemId: string | null }>(page, "/v1/webhooks/resend", {
    method: "POST",
    body: {
      from: "browser-lead@example.com",
      to: "deals@northgate.cre",
      subject: "401 Bryant tour request",
      text: "Saw the listing and can tour Friday.",
      messageId: `resend_browser_${Date.now()}`
    }
  });
  expect(webhookResponse.reviewItemId).toBeTruthy();

  const reviewItems = await apiJson<RoutingReviewItemDto[]>(page, "/v1/routing-review-items");
  const createdItem = reviewItems.find((item) => item.id === webhookResponse.reviewItemId);
  expect(createdItem?.confidence).toBeLessThan(0.8);
  expect(createdItem?.status).toBe("open");

  await page.getByRole("link", { name: "Routing review" }).click();

  await expect(page.getByRole("heading", { name: "Routing review" })).toBeVisible();
  await expect(page.getByText("41% confidence")).toBeVisible();

  await loginAs(page, "admin@northgate.cre");
  const updatedSettings = await apiJson<OrganizationSettingsDto>(page, "/v1/settings/organization", {
    method: "PATCH",
    body: { routingConfidenceThreshold: 0.5 }
  });
  expect(updatedSettings.routingConfidenceThreshold).toBe(0.5);

  await page.goto("/settings/organization");
  await expect(page.getByLabel("Routing confidence threshold")).toHaveValue("0.5");
});
