// @ts-check
const fs = require('fs');
const path = require('path');

const FIXTURES = path.join(__dirname, '..', 'fixtures');
const SAMPLE_LOGO = path.join(FIXTURES, 'sample-logo.png');
const STICKER_DRAFT_KEY = 'savovpro-sticker-draft-v1';
const ENGRAVE_DRAFT_KEY = 'savovpro-engrave-draft-v1';
const STICKER_ONBOARDING_KEY = 'savovpro-sticker-onboarding-v1';

function sampleLogoPath() {
  return SAMPLE_LOGO;
}

function sampleLogoPng() {
  return fs.readFileSync(SAMPLE_LOGO);
}

/** @param {import('@playwright/test').Page} page */
async function dismissStickerOnboarding(page) {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '1');
  }, STICKER_ONBOARDING_KEY);
}

/** @param {import('@playwright/test').Page} page */
async function clearStickerDraft(page) {
  await page.addInitScript((key) => {
    localStorage.removeItem(key);
  }, STICKER_DRAFT_KEY);
}

/** @param {import('@playwright/test').Page} page */
async function clearEngraveDraft(page) {
  await page.addInitScript((key) => {
    localStorage.removeItem(key);
  }, ENGRAVE_DRAFT_KEY);
}

/** One-time clear — does not run again on reload (use in draft-restore tests). */
/** @param {import('@playwright/test').Page} page */
async function clearEngraveDraftOnce(page) {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, ENGRAVE_DRAFT_KEY);
}

/** @param {import('@playwright/test').Page} page */
async function waitEngraveReady(page) {
  await page.waitForSelector('#kc-canvas');
  await page.waitForFunction(() => {
    var list = document.getElementById('kc-layers-list');
    return list && list.querySelector('.cfg-layer-item');
  });
}

/** @param {import('@playwright/test').Page} page */
async function waitStickerReady(page) {
  await page.waitForSelector('#st-canvas');
  await page.waitForFunction(() => {
    var list = document.getElementById('st-layers-list');
    return list && !list.querySelector('.cfg-layers-empty');
  });
  await page.waitForFunction(() => window.ST_VECTOR && ST_VECTOR.ready(), null, { timeout: 30_000 });
}

/** @param {import('@playwright/test').Page} page */
async function switchStickerAdvanced(page) {
  await page.locator('#st-mode-advanced').click();
  await page.waitForSelector('#st-layout.st-mode-advanced');
}

/** @param {import('@playwright/test').Page} page */
async function openEngraveClipart(page) {
  const acc = page.locator('#acc-media');
  if (!(await acc.evaluate((el) => el.classList.contains('is-open')))) {
    await acc.locator('.cfg-acc-head').click();
  }
  await page.waitForSelector('#kc-clipart-grid .cfg-clipart-btn', { timeout: 30_000 });
}

/** @param {import('@playwright/test').Page} page */
async function importStickerRaster(page, filePath) {
  await page.locator('#st-upload').setInputFiles(filePath);
  await page.waitForSelector('#st-import-dialog[open]');
  await page.locator('#st-import-confirm').click();
  await page.waitForFunction(() => {
    var dialog = document.getElementById('st-import-dialog');
    return dialog && !dialog.open;
  });
  await page.waitForSelector('#st-layers-list .cfg-layer-badge--image');
}

/** @param {import('@playwright/test').Page} page */
async function importStickerVector(page, filePath) {
  await page.locator('#st-upload').setInputFiles(filePath);
  await page.waitForSelector('#st-import-dialog[open]');
  await page.locator('#st-import-vector').click();
  await page.waitForFunction(() => {
    var dialog = document.getElementById('st-import-dialog');
    return dialog && !dialog.open;
  });
  await page.waitForSelector('#st-layers-list .cfg-layer-badge--vector');
}

/** @param {import('@playwright/test').Page} page @param {string} selector */
async function readDownloadText(page, selector) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator(selector).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  if (!filePath) throw new Error('Download did not produce a file');
  return fs.readFileSync(filePath, 'utf8');
}

module.exports = {
  sampleLogoPath,
  sampleLogoPng,
  dismissStickerOnboarding,
  clearStickerDraft,
  clearEngraveDraft,
  clearEngraveDraftOnce,
  waitEngraveReady,
  waitStickerReady,
  switchStickerAdvanced,
  openEngraveClipart,
  importStickerRaster,
  importStickerVector,
  readDownloadText,
  STICKER_DRAFT_KEY,
  ENGRAVE_DRAFT_KEY,
};
