import { expect, test } from "@playwright/test";
import { apiJson, expectSignedIn, loginAs, uniqueName } from "./helpers.js";

type DealDto = { id: string; title: string };
type ParticipantDto = { id: string; capabilities: string[] };

test("AM can create a deal, add participants, set grants, and edit workspace metadata", async ({ page }) => {
  await loginAs(page);
  await expectSignedIn(page, /\/deals$/);

  const dealTitle = uniqueName("Playwright deal");
  const createdDeal = await apiJson<DealDto>(page, "/v1/deals", {
    method: "POST",
    body: { title: dealTitle, primaryCompanyName: "Browser Holdings" }
  });
  const participant = await apiJson<ParticipantDto>(page, `/v1/deals/${createdDeal.id}/participants`, {
    method: "POST",
    body: { name: uniqueName("Browser Broker"), company: "Halcyon Capital", role: "broker", capabilities: ["viewDeal"] }
  });
  const updatedParticipant = await apiJson<ParticipantDto>(page, `/v1/deals/${createdDeal.id}/participants/${participant.id}`, {
    method: "PATCH",
    body: { capabilities: ["viewDeal", "uploadDocuments"] }
  });
  expect(updatedParticipant.capabilities).toEqual(["viewDeal", "uploadDocuments"]);

  await page.goto(`/deals/${createdDeal.id}`);
  await expect(page.getByRole("heading", { name: dealTitle })).toBeVisible();

  await page.getByRole("link", { name: "Documents" }).click();
  const documentTitle = uniqueName("Browser uploaded lease") + ".pdf";
  await page.getByPlaceholder("New lease.pdf").fill(documentTitle);
  await page.getByPlaceholder("Diligence").fill("Diligence");
  await page.getByRole("button", { name: "Add metadata" }).click();
  await expect(page.getByRole("button", { name: new RegExp(documentTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();

  await page.getByRole("link", { name: "Participants" }).click();
  const clientName = uniqueName("Casey Client");
  await page.getByPlaceholder("Add participant").fill(clientName);
  await page.getByPlaceholder("Company").fill("Casey Holdings");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(clientName)).toBeVisible();
});
