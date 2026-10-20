import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.SEED_USER_EMAIL ?? "e2e@gfofoods.ng");
  await page.getByLabel("Password").fill(process.env.SEED_USER_PASSWORD ?? "e2e-test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
  await page.context().storageState({ path: authFile });
});
