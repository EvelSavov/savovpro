// @ts-check
const { test, expect } = require('@playwright/test');

const ORIGIN = process.env.PRODUCTION_URL || 'https://savovpro.com';

test.describe('Production smoke @ savovpro.com', () => {
  test('vendor assets are not 404', async ({ request }) => {
    for (const path of [
      '/assets/js/vendor/opentype.min.js',
      '/assets/js/vendor/imagetracer.js',
      '/assets/js/configurator/sticker-vector.js',
      '/assets/fonts/montserrat-700.woff',
    ]) {
      const res = await request.get(ORIGIN + path);
      expect(res.status(), path).toBe(200);
    }
  });

  test('robots.txt and sitemap.xml are served', async ({ request }) => {
    expect((await request.get(ORIGIN + '/robots.txt')).status()).toBe(200);
    const sitemap = await request.get(ORIGIN + '/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('configurator.html');
  });

  test('homepage and configurator hub load', async ({ page }) => {
    await page.goto(ORIGIN + '/');
    await expect(page.locator('#hero-title')).toBeVisible();
    await page.goto(ORIGIN + '/configurator.html');
    await expect(page.locator('#cfg-hub-grid .cfg-hub-card')).toHaveCount(3);
  });

  test('sticker configurator loads engine scripts', async ({ page }) => {
    const urls = [];
    page.on('response', (r) => {
      if (/sticker-core\.js|sticker-vector\.js/.test(r.url())) urls.push(r.url());
    });
    await page.goto(ORIGIN + '/configurator-sticker.html?cat=stickers');
    await page.waitForSelector('#st-canvas', { timeout: 30_000 });
    expect(urls.some((u) => u.includes('sticker-core.js'))).toBeTruthy();
  });
});
