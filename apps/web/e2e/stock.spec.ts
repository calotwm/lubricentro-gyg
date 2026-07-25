import { test, expect } from '@playwright/test';

test.describe('Stock E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"], #username', 'admin');
    await page.fill('input[name="password"], #password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navigate to stock page from sidebar', async ({ page }) => {
    await page.click('a:has-text("Stock")');
    await expect(page).toHaveURL(/\/stock/);
    await expect(page.locator('h1')).toContainText('Stock Management');
  });

  test('stock page has three tabs', async ({ page }) => {
    await page.goto('/stock');
    await expect(page.getByRole('button', { name: /new movement/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /movement log/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /stock balance/i })).toBeVisible();
  });

  test('record a stock entry', async ({ page }) => {
    await page.goto('/stock');

    const productSelect = page.locator('#productId');
    if (await productSelect.locator('option').count() > 1) {
      await productSelect.selectOption({ index: 1 });
      await page.fill('#quantity', '5');
      await page.click('button:has-text("Record Movement")');

      await expect(page.locator('text=/success/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('view movement log with filters', async ({ page }) => {
    await page.goto('/stock');
    await page.click('button:has-text("Movement Log")');

    await expect(page.locator('#filterType')).toBeVisible();
    await expect(page.locator('#filterFrom')).toBeVisible();
    await expect(page.locator('#filterTo')).toBeVisible();
  });

  test('view stock balance with low stock filter', async ({ page }) => {
    await page.goto('/stock');
    await page.click('button:has-text("Stock Balance")');

    const lowStockCheckbox = page.locator('input[type="checkbox"]');
    await expect(lowStockCheckbox).toBeVisible();
  });
});
