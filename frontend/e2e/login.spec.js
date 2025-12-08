// frontend/e2e/login.spec.js
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Chit Fund/);
});

test('can open login modal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
