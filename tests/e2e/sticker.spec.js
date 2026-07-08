// @ts-check
const { test, expect } = require('@playwright/test');
const {
  dismissStickerOnboarding,
  clearStickerDraft,
  waitStickerReady,
  switchStickerAdvanced,
  readDownloadText,
  sampleLogoPath,
  sampleSvgPath,
  STICKER_DRAFT_KEY,
  STICKER_WIZARD_KEY,
  STICKER_TOUR_KEY,
} = require('./helpers');

test.describe('Sticker setup wizard', () => {
  test('pre-fills design on first visit', async ({ page }) => {
    await page.addInitScript((keys) => {
      keys.forEach(function (key) { localStorage.removeItem(key); });
    }, [STICKER_DRAFT_KEY, STICKER_WIZARD_KEY]);
    await page.addInitScript((key) => {
      localStorage.setItem(key, '1'); // suppress tour during wizard test
    }, STICKER_TOUR_KEY);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await page.waitForSelector('#st-canvas');
    await expect(page.locator('#st-setup-wizard[open]')).toBeVisible();
    await page.locator('#st-wizard-next').click();
    await page.locator('#st-wizard-next').click();
    await page.locator('#st-wizard-next').click();
    await page.locator('#st-wizard-text').fill('WIZARD TEST');
    await page.locator('#st-wizard-next').click();
    await page.locator('#st-wizard-done').click();
    await expect(page.locator('#st-setup-wizard[open]')).toHaveCount(0);
    await expect(page.locator('#st-text')).toHaveValue('WIZARD TEST');
    await expect(page.locator('#st-dim-label')).toContainText('20 × 10');
  });
});

test.describe('Sticker configurator', () => {
  test.beforeEach(async ({ page }) => {
    await dismissStickerOnboarding(page);
    await clearStickerDraft(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);
  });

  test('imports SVG as vector layer with preview', async ({ page }) => {
    await switchStickerAdvanced(page);
    await page.locator('#st-upload').setInputFiles(sampleSvgPath());
    await page.waitForSelector('#st-import-dialog[open]');
    await expect(page.locator('#st-import-confirm-svg')).toBeEnabled();
    await page.waitForFunction(() => {
      var canvas = document.getElementById('st-import-preview');
      if (!canvas) return false;
      var ctx = canvas.getContext('2d');
      var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (var i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return true;
      }
      return false;
    });
    await page.locator('#st-import-confirm-svg').click();
    await page.waitForFunction(() => {
      var dialog = document.getElementById('st-import-dialog');
      return dialog && !dialog.open;
    });
    await expect(page.locator('#st-edit-vector')).toBeVisible();
    await expect(page.locator('#st-layers-list .cfg-layer-badge--vector')).toBeVisible();
  });

  test('rejects PNG upload with alert', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('#st-upload').setInputFiles(sampleLogoPath());
    await expect(page.locator('#st-import-dialog[open]')).toHaveCount(0);
    await expect(page.locator('#st-layers-list .cfg-layer-badge--image')).toHaveCount(0);
  });

  test('SVG export auto-converts text to paths', async ({ page }) => {
    await page.locator('#st-text').fill('PLOTTER TEST');
    const svg = await readDownloadText(page, '#st-download-svg-basic');
    expect(svg).toContain('<path');
    expect(svg).toContain('fill="#C9A227"');
    expect(svg).not.toMatch(/<text[\s>]/);
    expect(svg).not.toMatch(/<image[\s>]/);
  });

  test('SVG plotter export resolves Cyrillic and digits in paths', async ({ page }) => {
    await page.locator('#st-text').fill('текст11231');
    const svg = await readDownloadText(page, '#st-download-svg-basic');
    const pathMatch = svg.match(/<path[^>]*d=\"([^\"]*)\"/);
    expect(pathMatch).toBeTruthy();
    expect(pathMatch[1].length).toBeGreaterThan(800);
    expect(svg).not.toMatch(/<text[\s>]/);
  });

  test('PNG export opens preview dialog before save', async ({ page }) => {
    await page.locator('#st-text').fill('PNG PREVIEW');
    await page.locator('#st-download-order-png').click();
    await expect(page.locator('#st-export-dialog[open]')).toBeVisible();
    await page.waitForFunction(() => !document.getElementById('st-export-save').disabled, null, { timeout: 15_000 });
    await expect(page.locator('#st-export-preview-img')).toBeVisible();
    await expect(page.locator('#st-export-save')).toBeEnabled();
  });

  test('SVG export preview renders vector paths', async ({ page }) => {
    await page.locator('#st-text').fill('текст11231');
    await page.waitForTimeout(400);
    await page.locator('#st-download-svg-basic').click();
    await page.waitForSelector('#st-export-dialog[open]');
    await page.waitForFunction(() => !document.getElementById('st-export-save').disabled);
    const previewSample = await page.evaluate(() => {
      var img = document.getElementById('st-export-preview-img');
      var c = document.createElement('canvas');
      c.width = img.naturalWidth || 300;
      c.height = img.naturalHeight || 300;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      var data = ctx.getImageData(0, 0, c.width, c.height).data;
      var gold = 0;
      var dark = 0;
      for (var i = 0; i < data.length; i += 4) {
        if (data[i] > 140 && data[i + 1] > 100 && data[i + 2] < 100 && data[i + 3] > 20) gold++;
        if (data[i] < 60 && data[i + 1] < 60 && data[i + 2] < 60 && data[i + 3] > 20) dark++;
      }
      return { gold: gold, dark: dark };
    });
    expect(previewSample.gold).toBeGreaterThan(100);
    expect(previewSample.dark).toBeGreaterThan(100);
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
  test('does not persist draft without edits', async ({ page }) => {
    await dismissStickerOnboarding(page);
    await clearStickerDraft(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);
    await page.waitForTimeout(1200);
    const saved = await page.evaluate((key) => localStorage.getItem(key), STICKER_DRAFT_KEY);
    expect(saved).toBeNull();
    await page.reload();
    await page.waitForSelector('#st-canvas');
    await expect(page.locator('#st-setup-wizard[open]')).toBeVisible();
    await expect(page.locator('#st-draft-resume-dialog[open]')).toHaveCount(0);
  });

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
    await page.waitForSelector('#st-canvas');
    await expect(page.locator('#st-draft-resume-dialog[open]')).toBeVisible();
    await page.locator('#st-draft-resume-continue').click();
    await waitStickerReady(page);
    await expect(page.locator('#st-draft-resume-dialog[open]')).toHaveCount(0);
    await expect(page.locator('#st-text')).toHaveValue(unique);
  });

  test('starts fresh when choosing new design', async ({ page }) => {
    await dismissStickerOnboarding(page);
    await page.goto('/configurator-sticker.html?cat=stickers');
    await waitStickerReady(page);

    const unique = 'OLD-' + Date.now();
    await page.locator('#st-text').fill(unique);
    await page.waitForTimeout(1200);
    await page.reload();
    await page.waitForSelector('#st-canvas');
    await expect(page.locator('#st-draft-resume-dialog[open]')).toBeVisible();
    await page.locator('#st-draft-resume-new').click();
    await expect(page.locator('#st-setup-wizard[open]')).toBeVisible();
    await page.locator('#st-wizard-skip-top').click();
    await waitStickerReady(page);
    await expect(page.locator('#st-draft-resume-dialog[open]')).toHaveCount(0);
    await expect(page.locator('#st-text')).not.toHaveValue(unique);
  });
});
