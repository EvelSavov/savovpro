// @ts-check
const { test, expect } = require('@playwright/test');
const {
  waitEngraveReady,
  dismissStickerOnboarding,
  clearStickerDraft,
  waitStickerReady,
} = require('./helpers');

test.describe('Mobile UX', () => {
  test('keychain sticky WhatsApp bar meets touch target size', async ({ page }) => {
    await page.goto('/configurator-product.html?cat=keychains');
    await waitEngraveReady(page);

    const bar = page.locator('.cfg-mobile-order-bar');
    await expect(bar).toBeVisible();

    const wa = page.locator('#btn-wa-mobile');
    await expect(wa).toBeVisible();
    expect(await wa.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/359884121606\?text=/);

    const box = await wa.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('sticker configurator loads with order exports on mobile', async ({ page }) => {
    await dismissStickerOnboarding(page);
    await clearStickerDraft(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);

    await expect(page.locator('#st-canvas')).toBeVisible();
    await expect(page.locator('.cfg-order-exports')).toBeVisible();
    await expect(page.locator('#btn-wa-mobile')).toBeVisible();
  });

  test('homepage mobile nav toggle opens menu', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.nav-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#site-nav')).toBeVisible();
  });
});
