import { test, expect } from '@playwright/test';

test.describe('Reports E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"], #username', 'admin');
    await page.fill('input[name="password"], #password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navigate to reports page', async ({ page }) => {
    await page.click('a:has-text("Reports")');
    await expect(page).toHaveURL(/\/reports/);
    await expect(page.locator('h1')).toContainText('Reports');
  });

  test('reports page has movement and valuation tabs', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('button', { name: /movement report/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /stock valuation/i })).toBeVisible();
  });

  test('movement report has date filters', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.locator('#reportFrom')).toBeVisible();
    await expect(page.locator('#reportTo')).toBeVisible();
    await expect(page.locator('#reportGroupBy')).toBeVisible();
  });

  test('switch to valuation tab', async ({ page }) => {
    await page.goto('/reports');
    await page.click('button:has-text("Stock Valuation")');
    await expect(page.locator('text=Grand Total')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Users E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"], #username', 'admin');
    await page.fill('input[name="password"], #password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navigate to admin users page', async ({ page }) => {
    await page.click('a:has-text("Users")');
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator('h1')).toContainText('User Management');
  });

  test('admin can see create user button', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('button', { name: /new user/i })).toBeVisible();
  });

  test('admin can open create user form', async ({ page }) => {
    await page.goto('/admin/users');
    await page.click('button:has-text("New User")');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });
});
