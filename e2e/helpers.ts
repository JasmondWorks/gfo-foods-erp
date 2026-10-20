import type { Page } from "@playwright/test";

/** Opens a shadcn/Radix Select by its trigger id or accessible name, then picks an option by visible text. */
export async function selectOption(page: Page, trigger: { id?: string; label?: string }, optionText: string) {
  const locator = trigger.id ? page.locator(`#${trigger.id}`) : page.getByRole("combobox", { name: trigger.label });
  await locator.click();
  await page.getByRole("option", { name: optionText, exact: false }).first().click();
}
