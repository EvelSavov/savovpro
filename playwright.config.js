// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:8765',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 8765',
    url: 'http://127.0.0.1:8765',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/mobile.spec.js', '**/production.spec.js'],
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/mobile.spec.js',
    },
    {
      name: 'production',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/production.spec.js',
    },
  ],
});
