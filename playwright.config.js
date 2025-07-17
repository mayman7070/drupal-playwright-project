
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  retries: 0,
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'on',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 50
    }
  },
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]]
});


