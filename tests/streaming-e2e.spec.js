// tests/streaming-e2e.spec.js
const { test, expect } = require('@playwright/test');
const { HomePage } = require('./pages/HomePage');
const { PreviewPage } = require('./pages/PreviewPage');
const { CheckoutPage } = require('./pages/CheckoutPage');

test('TC_01: Verify 17 Character VIN Decode', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);

  await home.navigate();
  
  // Start time
  const startTime = Date.now();

  // Trigger action
  await home.decodeVin('4JGED6EB0JA121898', 3);
  
  // Wait for navigation and verify specs
  await preview.verifySpecsVisible();
  
  // End time
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // Convert to seconds
  console.log(`\nTC_01 VIN Decode Duration: ${duration} seconds`);

  // Verify Access Record button
  await preview.verifyAccessRecordButton();
  await preview.clickAccessRecordButton();
});

test('TC_02: Verify Classic VIN Decode', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);

  await home.navigate();
  
  // Start time
  const startTime = Date.now();

  // Trigger action
  await home.decodeVin('223870L108421');
  
  // Wait for navigation and verify specs
  await preview.verifySpecsVisible();

  // End time
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // Convert to seconds
  console.log(`\nTC_02 VIN Decode Duration: ${duration} seconds`);

  // Verify Access Record button
  await preview.verifyAccessRecordButton();
  await preview.clickAccessRecordButton();
});
