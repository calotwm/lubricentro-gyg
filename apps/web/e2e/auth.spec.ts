import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="username"], #username', 'admin');
    await page.fill('input[name="password"], #password', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="username"], #username', 'admin');
    await page.fill('input[name="password"], #password', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('logout clears token and redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"], #username', 'admin');
    await page.fill('input[name="password"], #password', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);

    await page.click('text=Logout');
    await expect(page).toHaveURL(/\/login/);
  });
});
