import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function loginAs(page: Page, email = "am@northgate.cre") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function expectSignedIn(page: Page, path: RegExp) {
  await expect(page).toHaveURL(path);
  await expect(page.getByText("Northgate CRE")).toBeVisible();
}

export async function apiJson<T = unknown>(page: Page, path: string, init: { method?: string; body?: unknown } = {}) {
  return page.evaluate(
    async ({ body, method, path: apiPath }) => {
      const response = await fetch(apiPath, {
        method: method ?? "GET",
        credentials: "include",
        headers: body === undefined ? undefined : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const text = await response.text();
      const payload = text ? JSON.parse(text) : null;
      if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(payload)}`);
      return payload;
    },
    { body: init.body, method: init.method, path }
  ) as Promise<T>;
}

export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
