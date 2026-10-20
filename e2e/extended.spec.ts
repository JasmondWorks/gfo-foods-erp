import { test, expect } from "@playwright/test";
import { selectOption } from "./helpers";

test.describe.configure({ mode: "serial" });

const materialName = `E2E Ginger ${Date.now()}`;
const productAName = `E2E Zobo Mix ${Date.now()}`;
const productBName = `E2E Curry Mix ${Date.now()}`;
const unreferencedProductName = `E2E Unused Product ${Date.now()}`;

test.describe("settings", () => {
  test("updating business name reflects across the app and persists", async ({ page }) => {
    await page.goto("/settings");
    const newName = `E2E Foods Co ${Date.now()}`;
    await page.getByLabel("Business Name").fill(newName);
    await page.getByRole("button", { name: "Save Settings" }).click();
    await expect(page.getByText(/updated successfully/i)).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Business Name")).toHaveValue(newName);
    await expect(page.getByText(newName).first()).toBeVisible();

    // Restore the default so other tests/pages aren't affected.
    await page.getByLabel("Business Name").fill("GFO Foods");
    await page.getByRole("button", { name: "Save Settings" }).click();
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test("toggling the daily reminder reveals the reminder time field", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByLabel("Reminder Time (Hour of Day 0-23)")).toHaveCount(0);
    await page.getByLabel("Daily Entry Reminder").click();
    await expect(page.getByLabel("Reminder Time (Hour of Day 0-23)")).toBeVisible();
    await page.getByRole("button", { name: "Save Settings" }).click();
    await expect(page.getByText(/updated successfully/i)).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Reminder Time (Hour of Day 0-23)")).toBeVisible();

    // Turn it back off.
    await page.getByLabel("Daily Entry Reminder").click();
    await page.getByRole("button", { name: "Save Settings" }).click();
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });
});

test.describe("edit flows", () => {
  test("editing a raw material persists the new reorder threshold", async ({ page }) => {
    await page.goto("/raw-materials/new");
    await page.getByLabel("Name").fill(materialName);
    await selectOption(page, { id: "unit" }, "kg");
    await page.getByLabel("Alert me below").fill("5");
    await page.getByRole("button", { name: "Save", exact: false }).first().click();
    await expect(page).toHaveURL("/raw-materials");

    await page.getByText(materialName).first().click();
    await page.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/raw-materials\/(?!new$)[a-z0-9]+\/edit$/);

    await expect(page.getByLabel("Name")).toHaveValue(materialName);
    await page.getByLabel("Alert me below").fill("12");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/raw-materials\/(?!new$)[a-z0-9]+$/);
    await expect(page.getByText(/reorder threshold: 12/i)).toBeVisible();
  });

  test("editing a product persists the new selling price", async ({ page }) => {
    await page.goto("/products/new");
    await page.getByLabel("Name").fill(productAName);
    await page.getByLabel("Package size").fill("100g");
    await page.getByLabel("Selling price (₦)").fill("2000");
    await page.getByRole("button", { name: "Save", exact: false }).first().click();
    await expect(page).toHaveURL(/\/products\/(?!new$)[a-z0-9]+\/recipe$/);

    // Attach a recipe so this product can be sold.
    await page.getByLabel("Batch yields").fill("10");
    await selectOption(page, { id: "yieldUnit" }, "piece");
    await selectOption(page, { label: "Material" }, materialName);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("1");
    await page.getByRole("button", { name: "Save recipe" }).click();
    await expect(page).toHaveURL(/\/products\/(?!new$)[a-z0-9]+$/);

    await page.getByRole("link", { name: "Edit Product" }).click();
    await expect(page.getByLabel("Name")).toHaveValue(productAName);
    await page.getByLabel("Selling price (₦)").fill("2500");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/products\/(?!new$)[a-z0-9]+$/);
    await expect(page.getByText(/2,500/).first()).toBeVisible();
  });

  test("deleting a product with no history succeeds", async ({ page }) => {
    await page.goto("/products/new");
    await page.getByLabel("Name").fill(unreferencedProductName);
    await page.getByLabel("Selling price (₦)").fill("500");
    await page.getByRole("button", { name: "Save", exact: false }).first().click();
    await expect(page).toHaveURL(/\/products\/(?!new$)[a-z0-9]+\/recipe$/);

    await page.goto("/products");
    await page.getByText(unreferencedProductName).first().click();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete product" }).click();
    await expect(page).toHaveURL("/products");
    await expect(page.getByText(unreferencedProductName)).toHaveCount(0);
  });
});

test.describe("multi-line sales and reports", () => {
  test("a sale with two different product lines totals correctly and updates both stocks", async ({
    page,
  }) => {
    // Give the first product purchased stock, and create + stock a second product.
    await page.goto("/purchases/new");
    await selectOption(page, { id: "material" }, materialName);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("50");
    await page.getByLabel("Total Purchase Cost (₦)").fill("25000");
    await page.getByRole("button", { name: "Save Purchase & Update Stock" }).click();
    await expect(page).toHaveURL("/purchases");

    await page.goto("/products/new");
    await page.getByLabel("Name").fill(productBName);
    await page.getByLabel("Selling price (₦)").fill("1000");
    await page.getByRole("button", { name: "Save", exact: false }).first().click();
    await page.getByLabel("Batch yields").fill("10");
    await selectOption(page, { id: "yieldUnit" }, "piece");
    await selectOption(page, { label: "Material" }, materialName);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("1");
    await page.getByRole("button", { name: "Save recipe" }).click();

    await page.goto("/batches/new");
    await selectOption(page, { id: "product" }, productAName);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("10");
    await page.getByRole("button", { name: "Complete Batch Run" }).click();
    await expect(page).toHaveURL(/\/batches\/(?!new$)[a-z0-9]+$/);

    await page.goto("/batches/new");
    await selectOption(page, { id: "product" }, productBName);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("10");
    await page.getByRole("button", { name: "Complete Batch Run" }).click();
    await expect(page).toHaveURL(/\/batches\/(?!new$)[a-z0-9]+$/);

    // Now sell 2 of product A (@2500) and 3 of product B (@1000) in a single sale.
    await page.goto("/sales/new");
    const rows = page.locator("div.space-y-3.rounded-xl");
    await rows.nth(0).getByRole("combobox", { name: "Product" }).click();
    await page.getByRole("option", { name: productAName, exact: false }).first().click();
    await rows.nth(0).getByRole("textbox", { name: "Quantity", exact: true }).fill("2");

    await page.getByRole("button", { name: "Add another product line" }).click();
    await rows.nth(1).getByRole("combobox", { name: "Product" }).click();
    await page.getByRole("option", { name: productBName, exact: false }).first().click();
    await rows.nth(1).getByRole("textbox", { name: "Quantity", exact: true }).fill("3");

    await page.getByRole("button", { name: "Record Sale" }).click();
    await expect(page).toHaveURL(/\/sales\/(?!new$)[a-z0-9]+$/);

    // 2 * 2500 + 3 * 1000 = 8000
    await expect(page.getByText(/8,000/).first()).toBeVisible();

    await page.goto("/products");
    await expect(page.getByRole("row", { name: new RegExp(productAName) })).toContainText("8 units");
    await expect(page.getByRole("row", { name: new RegExp(productBName) })).toContainText("7 units");
  });

  test("reports page reflects recorded sales and expenses", async ({ page }) => {
    await page.goto("/expenses/new");
    await selectOption(page, { label: "Expense Category" }, "Packaging");
    await page.getByLabel("Amount Spent (₦)").fill("1234");
    await page.getByRole("button", { name: "Record Expense" }).click();
    await expect(page).toHaveURL("/expenses");

    await page.goto("/reports");
    await expect(page.getByText("Business Reports & Analytics")).toBeVisible();
    await expect(page.getByText(/1,234/).first()).toBeVisible();
    await expect(page.getByText("Packaging")).toBeVisible();
    await expect(page.getByText(productAName).first()).toBeVisible();
  });
});
