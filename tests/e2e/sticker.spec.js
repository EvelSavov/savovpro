// @ts-check
const { test, expect } = require('@playwright/test');
const {
  dismissStickerOnboarding,
  clearStickerDraft,
  waitStickerReady,
  switchStickerAdvanced,
  importStickerRaster,
  readDownloadText,
  sampleLogoPath,
  STICKER_DRAFT_KEY,
} = require('./helpers');

test.describe('Sticker configurator', () => {
  test.beforeEach(async ({ page }) => {
    await dismissStickerOnboarding(page);
    await clearStickerDraft(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);
  });

  test('imports PNG as raster and vector layers', async ({ page }) => {
    await switchStickerAdvanced(page);
    const logo = sampleLogoPath();

    await importStickerRaster(page, logo);
    await expect(page.locator('#st-edit-image')).toBeVisible();

    await page.locator('#st-upload').setInputFiles(logo);
    await page.waitForSelector('#st-import-dialog[open]');
    await page.locator('#st-import-vector').click();
    await page.waitForFunction(() => {
      var dialog = document.getElementById('st-import-dialog');
      return dialog && !dialog.open;
    });
    await expect(page.locator('#st-layers-list .cfg-layer-badge--vector')).toBeVisible();
  });

  test('trace button converts raster layer to vector', async ({ page }) => {
    await switchStickerAdvanced(page);
    await importStickerRaster(page, sampleLogoPath());
    await expect(page.locator('#st-trace-layer')).toBeVisible();
    await page.locator('#st-trace-layer').click();
    await expect(page.locator('#st-edit-vector')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#st-layers-list .cfg-layer-badge--vector')).toBeVisible();
  });

  test('SVG plotter export uses paths instead of text elements', async ({ page }) => {
    await page.locator('#st-text').fill('PLOTTER TEST');
    const svg = await readDownloadText(page, '#st-download-svg-basic');
    expect(svg).toContain('<path');
    expect(svg).not.toMatch(/<text[\s>]/);
    expect(svg).not.toMatch(/<image[\s>]/);
  });

  test('loads sticker scripts with cache-bust query', async ({ page }) => {
    const urls = [];
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('sticker-core.js') || url.includes('sticker-vector.js')) {
        urls.push(url);
      }
    });
    await page.reload();
    await waitStickerReady(page);
    expect(urls.some((url) => /sticker-core\.js\?v=/.test(url))).toBeTruthy();
    expect(urls.some((url) => /sticker-vector\.js\?v=/.test(url))).toBeTruthy();
  });
});

test.describe('Sticker draft restore', () => {
  test('restores design after refresh', async ({ page }) => {
    await dismissStickerOnboarding(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);

    const unique = 'DRAFT-' + Date.now();
    await page.locator('#st-text').fill(unique);
    await page.waitForTimeout(1200);

    const saved = await page.evaluate((key) => localStorage.getItem(key), STICKER_DRAFT_KEY);
    expect(saved).toBeTruthy();

    await page.reload();
    await waitStickerReady(page);
    await expect(page.locator('#st-draft-notice')).toBeVisible();
    await expect(page.locator('#st-text')).toHaveValue(unique);
  });
});
