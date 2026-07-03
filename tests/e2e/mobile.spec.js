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

    await expect(page.locator('#st-mobile-tabs')).toBeVisible();
    await expect(page.locator('#st-tab-design')).toBeVisible();
    await expect(page.locator('#st-canvas')).toBeVisible();
    await page.locator('#st-tab-order').click();
    await expect(page.locator('.cfg-order-exports')).toBeVisible();
    await expect(page.locator('#btn-wa-mobile')).toBeVisible();
    await expect(page.locator('#btn-export-mobile')).toBeVisible();
  });

  test('sticker mobile tabs switch panels', async ({ page }) => {
    await dismissStickerOnboarding(page);
    await clearStickerDraft(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);

    await expect(page.locator('#st-layout')).toHaveClass(/st-mobile-tab-design/);
    await page.locator('#st-tab-edit').click();
    await expect(page.locator('#st-layout')).toHaveClass(/st-mobile-tab-edit/);
    await expect(page.locator('#st-text')).toBeVisible();
    await expect(page.locator('#st-canvas')).toBeHidden();
    await page.locator('#st-tab-design').click();
    await expect(page.locator('#st-canvas')).toBeVisible();
  });

  test('sticker quick actions menu opens on mobile', async ({ page }) => {
    await dismissStickerOnboarding(page);
    await clearStickerDraft(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);

    await expect(page.locator('#st-mobile-quick-btn')).toBeVisible();
    await expect(page.locator('#st-mobile-quick-btn')).toHaveAttribute('aria-label', 'Още действия');
    await page.locator('#st-mobile-quick-btn').click();
    await expect(page.locator('#st-quick-actions-dialog[open]')).toBeVisible();
    await expect(page.locator('[data-st-quick="size"]')).toBeVisible();
    await page.locator('#st-quick-actions-close').click();
    await expect(page.locator('#st-quick-actions-dialog[open]')).toHaveCount(0);
  });

  test('sticker size opens bottom sheet dialog on mobile', async ({ page }) => {
    await dismissStickerOnboarding(page);
    await clearStickerDraft(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);

    const dimBtn = page.locator('#st-dim-btn');
    await expect(dimBtn).toBeVisible();
    const box = await dimBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);

    await dimBtn.click();
    await expect(page.locator('#st-size-dialog[open]')).toBeVisible();
    await expect(page.locator('#st-size-dlg-quick-sizes .st-pill-btn').first()).toBeVisible();

    await page.locator('#st-size-done').click();
    await expect(page.locator('#st-size-dialog[open]')).toHaveCount(0);
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
