require('dotenv').config();
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  reporter: [['html', { open: 'never' }]],
  use: {
    headless: true,
    baseURL: process.env.BASE_URL,
  },
});
