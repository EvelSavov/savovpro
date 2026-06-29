// @ts-check
/** Automates items from PRODUCTION-ROADMAP manual QA checklist. */
const { test, expect } = require('@playwright/test');
const {
  waitEngraveReady,
  waitStickerReady,
  dismissStickerOnboarding,
  clearEngraveDraft,
  clearStickerDraft,
  openEngraveClipart,
  sampleLogoPath,
} = require('./helpers');

test.describe('Manual QA checklist (automated)', () => {
  test('keychain: download CTA appears before WhatsApp order', async ({ page }) => {
    await clearEngraveDraft(page);
    await page.goto('/configurator-product.html?cat=keychains');
    await waitEngraveReady(page);

    const exports = page.locator('.cfg-order-exports');
    const wa = page.locator('#btn-wa');
    await expect(exports).toBeVisible();
    await expect(page.locator('#kc-download-order')).toBeVisible();
    await expect(wa).toBeVisible();

    const exportBox = await exports.boundingBox();
    const waBox = await wa.boundingBox();
    expect(exportBox).not.toBeNull();
    expect(waBox).not.toBeNull();
    expect(exportBox.y).toBeLessThan(waBox.y);
  });

  test('keychain: WA message asks to attach preview', async ({ page }) => {
    await clearEngraveDraft(page);
    await page.goto('/configurator-product.html?cat=keychains');
    await waitEngraveReady(page);
    await page.locator('#kc-line1').fill('QA TEST');

    const href = await page.locator('#btn-wa').getAttribute('href');
    const decoded = decodeURIComponent(href || '');
    expect(decoded).toMatch(/превю|прикачи/i);
  });

  test('keychain: per-category page title and meta', async ({ page }) => {
    await clearEngraveDraft(page);
    await page.goto('/configurator-product.html?cat=keychains');
    await waitEngraveReady(page);

    await expect(page).toHaveTitle(/Ключодържатели/);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toMatch(/ключодържател/i);
  });

  test('freshener: no double-sided engraving UI', async ({ page }) => {
    await clearEngraveDraft(page);
    await page.goto('/configurator-product.html?cat=fresheners');
    await waitEngraveReady(page);
    await expect(page.locator('#acc-engrave')).toBeHidden();
  });

  test('sticker: order exports and WA mention SVG', async ({ page }) => {
    await dismissStickerOnboarding(page);
    await clearStickerDraft(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);

    await expect(page.locator('.cfg-order-exports')).toBeVisible();
    await expect(page.locator('#st-download-order-png')).toBeVisible();
    await expect(page.locator('#st-download-svg-basic')).toBeVisible();
    await expect(page.locator('#btn-email')).toBeVisible();

    const href = await page.locator('#btn-wa').getAttribute('href');
    const decoded = decodeURIComponent(href || '');
    expect(decoded).toMatch(/SVG|svg|плотер/i);
  });

  test('sticker basic mode: email order CTA is visible', async ({ page }) => {
    await dismissStickerOnboarding(page);
    await clearStickerDraft(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);

    await expect(page.locator('#st-layout')).toHaveClass(/st-mode-basic/);
    await expect(page.locator('#btn-email')).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#btn-email-mobile')).toBeVisible();
  });

  test('clip-art picker loads icons when online', async ({ page }) => {
    await clearEngraveDraft(page);
    await page.goto('/configurator-product.html?cat=keychains');
    await waitEngraveReady(page);
    await openEngraveClipart(page);
    await expect(page.locator('#kc-clipart-grid .cfg-clipart-btn').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('clip-art shows graceful message when offline', async ({ page, context }) => {
    await clearEngraveDraft(page);
    await page.goto('/configurator-product.html?cat=keychains');
    await waitEngraveReady(page);

    const acc = page.locator('#acc-media');
    if (!(await acc.evaluate((el) => el.classList.contains('is-open')))) {
      await acc.locator('.cfg-acc-head').click();
    }

    await context.setOffline(true);
    await page.locator('#kc-clipart-q').fill('car');
    await page.locator('#kc-clipart-search-btn').click();
    await expect(page.locator('#kc-clipart-grid')).toContainText(/интернет|библиотеката|връзка/i, {
      timeout: 15000,
    });
  });
});
