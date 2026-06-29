// @ts-check
const { test, expect } = require('@playwright/test');
const { waitEngraveReady } = require('./helpers');

test.describe('Mobile order bar', () => {
  test('shows sticky WhatsApp CTA with touch-friendly height', async ({ page }) => {
    await page.goto('/configurator-product.html?cat=keychains');
    await waitEngraveReady(page);

    const bar = page.locator('.cfg-mobile-order-bar');
    await expect(bar).toBeVisible();

    const wa = page.locator('#btn-wa-mobile');
    await expect(wa).toBeVisible();
    const href = await wa.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\/359884121606\?text=/);

    const box = await wa.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
