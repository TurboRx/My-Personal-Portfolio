const { defineConfig } = require('@playwright/test');
const os = require('os');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests',
  use: {
    browserName: 'chromium',
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH || path.join(os.homedir(), 'chrome/linux-154.0.8037.57/chrome-linux64/chrome'),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
  },
});
