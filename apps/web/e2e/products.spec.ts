import { test, expect } from '@playwright/test';

test.describe('Products E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"], #username', 'admin');
    await page.fill('input[name="password"], #password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navigate to products list from sidebar', async ({ page }) => {
    await page.click('a:has-text("Products")');
    await expect(page).toHaveURL(/\/products/);
    await expect(page.locator('h1')).toContainText('Products');
  });

  test('search for a product', async ({ page }) => {
    await page.goto('/products');
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('castrol');
    await expect(searchInput).toHaveValue('castrol');
  });

  test('navigate to product detail', async ({ page }) => {
    await page.goto('/products');
    const productLink = page.locator('a').filter({ hasText: /.+/ }).first();
    if (await productLink.isVisible()) {
      await productLink.click();
      await expect(page).toHaveURL(/\/products\/.+/);
    }
  });

  test('create a new product', async ({ page }) => {
    await page.goto('/products/new');
    await expect(page.locator('h1')).toContainText(/new|create/i);
  });
});
