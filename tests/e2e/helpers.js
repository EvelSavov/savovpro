// @ts-check
const fs = require('fs');
const path = require('path');

const FIXTURES = path.join(__dirname, '..', 'fixtures');
const SAMPLE_LOGO = path.join(FIXTURES, 'sample-logo.png');
const STICKER_DRAFT_KEY = 'savovpro-sticker-draft-v1';
const ENGRAVE_DRAFT_KEY = 'savovpro-engrave-draft-v1';
const STICKER_ONBOARDING_KEY = 'savovpro-sticker-onboarding-v1';
const STICKER_WIZARD_KEY = 'savovpro-sticker-wizard-v1';
const STICKER_TOUR_KEY = 'savovpro-sticker-tour-v1';
const ENGRAVE_TOUR_KEY = 'savovpro-engrave-tour-v1';

function sampleLogoPath() {
  return SAMPLE_LOGO;
}

function sampleSvgPath() {
  return path.join(FIXTURES, 'sample-icon.svg');
}

function sampleLogoPng() {
  return fs.readFileSync(SAMPLE_LOGO);
}

/** @param {import('@playwright/test').Page} page */
async function dismissStickerOnboarding(page) {
  await page.addInitScript((keys) => {
    keys.forEach(function (key) { localStorage.setItem(key, '1'); });
  }, [STICKER_ONBOARDING_KEY, STICKER_WIZARD_KEY, STICKER_TOUR_KEY]);
}

/** @param {import('@playwright/test').Page} page */
async function clearStickerDraft(page) {
  await page.addInitScript((key) => {
    localStorage.removeItem(key);
  }, STICKER_DRAFT_KEY);
}

/** @param {import('@playwright/test').Page} page */
async function dismissEngraveOnboarding(page) {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '1');
  }, ENGRAVE_TOUR_KEY);
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
async function skipEngraveWizardIfOpen(page) {
  const wizard = page.locator('#kc-setup-wizard[open]');
  if (await wizard.count()) {
    await page.locator('#kc-wizard-skip-top').click();
    await page.waitForFunction(() => {
      var dlg = document.getElementById('kc-setup-wizard');
      return !dlg || !dlg.open;
    });
  }
}

/** @param {import('@playwright/test').Page} page */
async function continueEngraveDraftIfOpen(page) {
  const dialog = page.locator('#kc-draft-resume-dialog[open]');
  if (await dialog.count()) {
    await page.locator('#kc-draft-resume-continue').click();
    await page.waitForFunction(() => {
      var dlg = document.getElementById('kc-draft-resume-dialog');
      return !dlg || !dlg.open;
    });
  }
}

/** @param {import('@playwright/test').Page} page */
async function waitEngraveReady(page) {
  await page.waitForSelector('#kc-canvas');
  await page.waitForFunction(() => {
    var wizard  = document.getElementById('kc-setup-wizard');
    var resume  = document.getElementById('kc-draft-resume-dialog');
    var list    = document.getElementById('kc-layers-list');
    return (wizard && wizard.open) ||
           (resume && resume.open) ||
           (list && list.querySelector('.cfg-layer-item'));
  }, null, { timeout: 15_000 });
  await skipEngraveWizardIfOpen(page);
  await continueEngraveDraftIfOpen(page);
  await page.waitForFunction(() => {
    var list = document.getElementById('kc-layers-list');
    return list && list.querySelector('.cfg-layer-item');
  });
}

/** @param {import('@playwright/test').Page} page */
async function skipStickerWizardIfOpen(page) {
  const wizard = page.locator('#st-setup-wizard[open]');
  if (await wizard.count()) {
    await page.locator('#st-wizard-skip-top').click();
    await page.waitForFunction(() => {
      var dialog = document.getElementById('st-setup-wizard');
      return dialog && !dialog.open;
    });
  }
}

/** @param {import('@playwright/test').Page} page */
async function waitStickerReady(page) {
  await page.waitForSelector('#st-canvas');
  await page.waitForFunction(() => {
    var wizard = document.getElementById('st-setup-wizard');
    var list = document.getElementById('st-layers-list');
    var wizardOpen = wizard && wizard.open;
    var hasLayers = list && !list.querySelector('.cfg-layers-empty');
    return wizardOpen || hasLayers;
  }, null, { timeout: 15_000 });
  await skipStickerWizardIfOpen(page);
  await page.waitForFunction(() => {
    var list = document.getElementById('st-layers-list');
    return list && !list.querySelector('.cfg-layers-empty');
  });
  await page.waitForFunction(() => window.ST_VECTOR && ST_VECTOR.ready(), null, { timeout: 30_000 });
  await page.waitForFunction(() => window.ST_TRACE && ST_TRACE.ready(), null, { timeout: 30_000 });
}

/** @param {import('@playwright/test').Page} page */
async function switchStickerAdvanced(page) {
  await page.locator('#st-mode-advanced').click();
  await page.waitForSelector('#st-layout.st-mode-advanced');
}

/** @param {import('@playwright/test').Page} page */
async function switchEngraveAdvanced(page) {
  const layout = page.locator('#kc-layout');
  if (await layout.evaluate((el) => el.classList.contains('st-mode-advanced'))) return;
  await page.locator('#kc-mode-advanced').click();
  await page.waitForSelector('#kc-layout.st-mode-advanced');
}

/** @param {import('@playwright/test').Page} page */
async function openEngraveClipart(page) {
  await switchEngraveAdvanced(page);
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
  await page.waitForFunction(() => {
    var btn = document.getElementById('st-import-vector');
    return btn && !btn.disabled && btn.textContent !== 'Trace…';
  }, null, { timeout: 30_000 });
  await page.locator('#st-import-vector').click();
  await page.waitForFunction(() => {
    var dialog = document.getElementById('st-import-dialog');
    return dialog && !dialog.open;
  });
  await page.waitForSelector('#st-layers-list .cfg-layer-badge--vector');
}

/** @param {import('@playwright/test').Page} page */
async function importStickerSvgVector(page, filePath) {
  await page.locator('#st-upload').setInputFiles(filePath);
  await page.waitForSelector('#st-import-dialog[open]');
  await page.locator('#st-import-confirm-svg').click();
  await page.waitForFunction(() => {
    var dialog = document.getElementById('st-import-dialog');
    return dialog && !dialog.open;
  });
  await page.waitForSelector('#st-layers-list .cfg-layer-badge--vector');
}

/** @param {import('@playwright/test').Page} page @param {string} selector */
async function readDownloadText(page, selector) {
  await page.locator(selector).click();
  await page.waitForSelector('#st-export-dialog[open]');
  await page.waitForFunction(() => {
    var btn = document.getElementById('st-export-save');
    return btn && !btn.disabled;
  }, null, { timeout: 30_000 });
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#st-export-save').click();
  const download = await downloadPromise;
  const filePath = await download.path();
  if (!filePath) throw new Error('Download did not produce a file');
  return fs.readFileSync(filePath, 'utf8');
}

module.exports = {
  sampleLogoPath,
  sampleLogoPng,
  dismissStickerOnboarding,
  dismissEngraveOnboarding,
  clearStickerDraft,
  clearEngraveDraft,
  clearEngraveDraftOnce,
  waitEngraveReady,
  waitStickerReady,
  skipStickerWizardIfOpen,
  skipEngraveWizardIfOpen,
  continueEngraveDraftIfOpen,
  switchStickerAdvanced,
  switchEngraveAdvanced,
  openEngraveClipart,
  importStickerRaster,
  importStickerVector,
  importStickerSvgVector,
  readDownloadText,
  sampleSvgPath,
  STICKER_DRAFT_KEY,
  STICKER_WIZARD_KEY,
  STICKER_TOUR_KEY,
  ENGRAVE_DRAFT_KEY,
  ENGRAVE_TOUR_KEY,
};
