import { expect, test } from "@playwright/test";
import { apiJson, expectSignedIn, loginAs } from "./helpers.js";

type TaskDto = { id: string; route: string; status: string; title: string };
type VaWorkItemDto = { id: string; status: string; taskId: string };

test("AM approves system work and VA submits assigned work", async ({ page }) => {
  await loginAs(page);
  await expectSignedIn(page, /\/deals$/);
  await page.getByText("Sutter Tower - Floor 14").click();
  await page.getByRole("link", { name: "Tasks" }).click();

  await expect(page.getByRole("heading", { name: "Send LOI response to Halcyon" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
  const tasks = await apiJson<TaskDto[]>(page, "/v1/deals/deal_sutter/tasks");
  const systemTask = tasks.find((task) => task.id === "task_next");
  expect(systemTask?.route).toBe("system");
  const approvedTask = await apiJson<TaskDto>(page, "/v1/tasks/task_next/approve", {
    method: "POST",
    body: { reason: "Browser e2e approval" }
  });
  expect(approvedTask.status).toBe("completed");

  await loginAs(page, "va@northgate.cre");
  await expectSignedIn(page, /\/va$/);
  const [vaItem] = await apiJson<VaWorkItemDto[]>(page, "/v1/va-work-items");
  expect(vaItem.status).toBe("queued");
  const started = await apiJson<VaWorkItemDto>(page, `/v1/va-work-items/${vaItem.id}/start`, {
    method: "POST",
    body: { notes: "Browser taking this work" }
  });
  expect(started.status).toBe("in_progress");
  const submitted = await apiJson<VaWorkItemDto>(page, `/v1/va-work-items/${vaItem.id}/submit`, {
    method: "POST",
    body: { submittedPayload: { completed: true, source: "browser-e2e" } }
  });
  expect(submitted.status).toBe("submitted");

  await loginAs(page);
  await page.getByRole("link", { name: "VA queue" }).click();
  await expect(page.getByText("Pull estoppel cert").first()).toBeVisible();
  const accepted = await apiJson<VaWorkItemDto>(page, `/v1/va-work-items/${vaItem.id}/accept`, {
    method: "POST",
    body: { notes: "Looks good from browser e2e" }
  });
  expect(accepted.status).toBe("accepted");
});
