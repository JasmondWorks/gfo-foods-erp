import { test, expect } from "@playwright/test";
import { selectOption } from "./helpers";

test.describe.configure({ mode: "serial" });

const materialName = `E2E Pepper ${Date.now()}`;
const productName = `E2E Suya Mix ${Date.now()}`;

test.describe("core production loop", () => {
  test("create a raw material", async ({ page }) => {
    await page.goto("/raw-materials/new");
    await page.getByLabel("Name").fill(materialName);
    await selectOption(page, { id: "unit" }, "kg");
    await page.getByLabel("Alert me below").fill("5");
    await page.getByRole("button", { name: "Save", exact: false }).first().click();
    await expect(page).toHaveURL("/raw-materials");
    await expect(page.getByText(materialName).first()).toBeVisible();
  });

  test("create a product", async ({ page }) => {
    await page.goto("/products/new");
    await page.getByLabel("Name").fill(productName);
    await page.getByLabel("Package size").fill("50g");
    await page.getByLabel("Selling price (₦)").fill("1500");
    await page.getByLabel("Alert me below").fill("3");
    await page.getByRole("button", { name: "Save", exact: false }).first().click();
    // Creating a product redirects straight into its recipe editor.
    await expect(page).toHaveURL(/\/products\/[a-z0-9]+\/recipe$/);

    await page.goto("/products");
    await expect(page.getByText(productName).first()).toBeVisible();
  });

  test("record a purchase increases raw material stock", async ({ page }) => {
    await page.goto("/raw-materials");
    await page.getByText(materialName).first().click();
    await expect(page.getByText("0").first()).toBeVisible();

    await page.goto("/purchases/new");
    await selectOption(page, { id: "material" }, materialName);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("20");
    await page.getByLabel("Total Purchase Cost (₦)").fill("10000");
    await page.getByRole("button", { name: "Save Purchase & Update Stock" }).click();
    await expect(page).toHaveURL("/purchases");

    await page.goto("/raw-materials");
    const row = page.getByRole("row", { name: new RegExp(materialName) });
    await expect(row).toContainText("20");
  });

  test("attach a recipe to the product", async ({ page }) => {
    await page.goto("/products");
    await page.getByText(productName).first().click();
    await page.getByRole("link", { name: /set recipe/i }).click();

    await page.getByLabel("Batch yields").fill("10");
    await selectOption(page, { id: "yieldUnit" }, "piece");
    await selectOption(page, { label: "Material" }, materialName);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("2");
    await page.getByRole("button", { name: "Save recipe" }).click();

    // Recipe save redirects to the product detail page.
    await expect(page).toHaveURL(/\/products\/(?!new$)[a-z0-9]+$/);
    await expect(page.getByRole("link", { name: "Edit Recipe" })).toBeVisible();
  });

  test("recording a batch consumes raw material and increases product stock", async ({ page }) => {
    await page.goto("/batches/new");
    await selectOption(page, { id: "product" }, productName);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("5");
    await expect(page.getByText("Sufficient materials available in stock")).toBeVisible();
    await page.getByRole("button", { name: "Complete Batch Run" }).click();
    // No shortage, so the batch action redirects to the batch detail page.
    await expect(page).toHaveURL(/\/batches\/(?!new$)[a-z0-9]+$/);

    await page.goto("/raw-materials");
    const materialRow = page.getByRole("row", { name: new RegExp(materialName) });
    // Recipe: 2kg per 10-unit yield = 0.2kg/unit. 20 purchased - (5 * 0.2) = 19 remaining.
    await expect(async () => {
      await page.reload();
      await expect(materialRow).toContainText("19");
    }).toPass({ timeout: 10_000 });

    await page.goto("/products");
    const productRow = page.getByRole("row", { name: new RegExp(productName) });
    await expect(productRow).toContainText("5");
  });

  test("recording a batch beyond stock still succeeds but warns of shortage (FR-4)", async ({ page }) => {
    await page.goto("/batches/new");
    await selectOption(page, { id: "product" }, productName);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("100");
    await expect(page.getByText(/short on/i)).toBeVisible();
    await page.getByRole("button", { name: "Complete Batch Run" }).click();
    // Shortage warnings keep the user on the form instead of redirecting (FR-4).
    await expect(page).toHaveURL("/batches/new");
    await expect(page.getByText(/stock went negative/i)).toBeVisible();

    await page.goto("/raw-materials");
    const materialRow = page.getByRole("row", { name: new RegExp(materialName) });
    // 19 remaining - (100 * 0.2) = -1, negative stock allowed by design.
    await expect(materialRow).toContainText("-1");
  });

  let saleId: string;

  test("recording a sale decreases product stock and computes total", async ({ page }) => {
    await page.goto("/sales/new");
    await selectOption(page, { label: "Product" }, productName);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("3");
    await page.getByRole("textbox", { name: "Unit price", exact: true }).fill("1500");
    await page.getByLabel("Amount Paid (₦)").fill("3000");
    await page.getByRole("button", { name: "Record Sale" }).click();
    await expect(page).toHaveURL(/\/sales\/(?!new$)[a-z0-9]+$/);
    saleId = page.url().split("/").pop()!;

    await expect(page.getByText(/4,500|4500/).first()).toBeVisible();
    await expect(page.getByText(/partial/i).first()).toBeVisible();
  });

  test("overpaying outstanding balance in a single payment is rejected", async ({ page }) => {
    await page.goto(`/sales/${saleId}`);
    // Outstanding is 1500 (4500 total - 3000 paid); the field defaults to it.
    await page.getByLabel(/record a payment/i).fill("2000");
    await page.getByRole("button", { name: "Record payment" }).click();
    await expect(page.getByText(/exceed/i)).toBeVisible();
    // Balance remains outstanding — the rejected payment was not applied.
    await expect(page.getByText(/partial/i).first()).toBeVisible();
  });

  test("settling the exact outstanding balance marks the sale paid", async ({ page }) => {
    await page.goto(`/sales/${saleId}`);
    await page.getByRole("button", { name: "Record payment" }).click();
    await expect(page.getByText(/partial|paid/i).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(/paid/i).first()).toBeVisible();
  });

  test("record an expense", async ({ page }) => {
    await page.goto("/expenses/new");
    await selectOption(page, { label: "Expense Category" }, "Transport");
    await page.getByLabel("Amount Spent (₦)").fill("2500");
    await page.getByRole("button", { name: "Record Expense" }).click();
    await expect(page).toHaveURL("/expenses");
    await expect(page.getByText("2,500").first()).toBeVisible();
  });

  test("dashboard reflects recorded activity", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/last entry/i)).toBeVisible();
  });
});

test.describe("validation and edge cases", () => {
  test("rejects a negative purchase quantity", async ({ page }) => {
    await page.goto("/raw-materials/new");
    const name = `E2E Guard ${Date.now()}`;
    await page.getByLabel("Name").fill(name);
    await selectOption(page, { id: "unit" }, "kg");
    await page.getByRole("button", { name: "Save", exact: false }).first().click();
    await expect(page).toHaveURL("/raw-materials");

    await page.goto("/purchases/new");
    await selectOption(page, { id: "material" }, name);
    await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("-5");
    await page.getByLabel("Total Purchase Cost (₦)").fill("1000");
    await page.getByRole("button", { name: "Save Purchase & Update Stock" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page).toHaveURL("/purchases/new");
  });

  test("cannot delete a raw material referenced by a purchase", async ({ page }) => {
    await page.goto("/raw-materials");
    await page.getByText(materialName).first().click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete material" }).click();
    await expect(page.getByText(/cannot|in use|referenced|existing|history/i)).toBeVisible();
  });

  test("required fields block submission", async ({ page }) => {
    await page.goto("/products/new");
    await page.getByRole("button", { name: "Save", exact: false }).first().click();
    await expect(page).toHaveURL("/products/new");
  });
});
