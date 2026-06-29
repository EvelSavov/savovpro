// @ts-check
const { test, expect } = require('@playwright/test');

const CATEGORIES = [
  {
    title: 'Ключодържатели',
    url: /configurator-product\.html\?cat=keychains/,
    ready: '#kc-canvas',
  },
  {
    title: 'Ароматизатори',
    url: /configurator-product\.html\?cat=fresheners/,
    ready: '#kc-canvas',
  },
  {
    title: 'Стикери',
    url: /configurator-sticker\.html\?cat=stickers/,
    ready: '#st-canvas',
  },
];

test.describe('Configurator hub', () => {
  test('lists all active categories', async ({ page }) => {
    await page.goto('/configurator.html');
    await expect(page.locator('.cfg-hub-card')).toHaveCount(CATEGORIES.length);
    for (const cat of CATEGORIES) {
      await expect(page.getByRole('link', { name: cat.title })).toBeVisible();
    }
  });

  for (const cat of CATEGORIES) {
    test('opens ' + cat.title, async ({ page }) => {
      await page.goto('/configurator.html');
      await page.getByRole('link', { name: cat.title }).click();
      await expect(page).toHaveURL(cat.url);
      await page.waitForSelector(cat.ready);
    });
  }
});
