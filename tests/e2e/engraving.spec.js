// @ts-check
const { test, expect } = require('@playwright/test');
const {
  waitEngraveReady,
  openEngraveClipart,
  sampleLogoPath,
} = require('./helpers');

test.describe('Keychain engrave configurator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/configurator-product.html?cat=keychains');
    await waitEngraveReady(page);
  });

  test('supports text, clipart icon, and logo upload layers', async ({ page }) => {
    await page.locator('#kc-line1').fill('SAVOV PRO');
    await openEngraveClipart(page);
    const layersBefore = await page.locator('#kc-layers-list .cfg-layer-item').count();
    await page.locator('#kc-clipart-grid .cfg-clipart-btn').first().click();
    await expect(page.locator('#kc-layers-list .cfg-layer-item')).toHaveCount(layersBefore + 1);
    await expect(page.locator('#kc-layers-list .cfg-layer-badge--icon')).toBeVisible();

    await page.locator('#kc-upload').setInputFiles(sampleLogoPath());
    await expect(page.locator('#kc-layers-list .cfg-layer-badge--image')).toBeVisible();
    await expect(page.locator('#kc-layers-list .cfg-layer-item')).toHaveCount(layersBefore + 2);
  });

  test('shows double-sided engraving UI', async ({ page }) => {
    await expect(page.locator('#acc-engrave')).toBeVisible();
    await page.locator('.cfg-sides-btn[data-sides="2"]').click();
    await expect(page.locator('#kc-design-mode')).toBeVisible();
    await expect(page.locator('#kc-side-tabs')).toBeHidden();
  });

  test('downloads PNG preview', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#kc-download').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('savovpro-preview.png');
  });

  test('builds WhatsApp order link', async ({ page }) => {
    await page.locator('#kc-line1').fill('TEST ORDER');
    const href = await page.locator('#btn-wa').getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\/359884121606\?text=/);
    const decoded = decodeURIComponent(href || '');
    expect(decoded).toContain('TEST ORDER');
    expect(decoded).toContain('Ключодържатели');
  });
});

test.describe('Freshener engrave configurator', () => {
  test('hides double-sided engraving section', async ({ page }) => {
    await page.goto('/configurator-product.html?cat=fresheners');
    await waitEngraveReady(page);
    await expect(page.locator('#acc-engrave')).toBeHidden();
    await expect(page.locator('#kc-layers-list .cfg-layer-item')).toHaveCount(1);
    await page.locator('#kc-line1').fill('АРОМА');
    await expect(page.locator('#kc-line1')).toHaveValue('АРОМА');
  });
});
