require('dotenv').config();
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 1, // Reduced to 1 retry
  reporter: [['html', { open: 'never' }]],
  workers: 2,
  use: {
    headless: true,
    baseURL: process.env.BASE_URL,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'en-US',
  },
});
