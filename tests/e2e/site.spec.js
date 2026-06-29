// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Public site smoke', () => {
  test('homepage has hero and key navigation', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('#hero-title')).toBeVisible();
    await expect(page.getByRole('link', { name: /Персонализирай/i }).first()).toBeVisible();
    await expect(page.locator('#services')).toBeAttached();
  });

  test('configurator hub renders category grid', async ({ page }) => {
    await page.goto('/configurator.html');
    await expect(page.locator('.cfg-hub-intro')).toBeVisible();
    await expect(page.locator('#cfg-hub-grid')).toBeVisible();
    await expect(page.locator('.cfg-hub-card')).toHaveCount(3);
  });
});
