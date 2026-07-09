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
  
  // Wait for navigation and verify specs with extended timeout (60s)
  await preview.verifySpecsVisible('Records found for', 60000);

  // End time
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // Convert to seconds
  console.log(`\nTC_02 VIN Decode Duration: ${duration} seconds`);

  // Verify Access Record button
  await preview.verifyAccessRecordButton();
  await preview.clickAccessRecordButton();
});

test('TC_04: Verify Revisit Banner', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);

  // 1. Perform TC_01 flow
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();
  
  // 2. Go back
  await page.goBack();
  await page.waitForLoadState('load');
  
  // 3. Explicit 1s pause after page load as requested
  await page.waitForTimeout(1000);
  
  console.log('Navigated back to Home, waited 1s:', page.url());

  // 4. Verify Revisit banner and click "Grab it now"
  const banner = await home.verifyRevisitBannerVisible();
  await home.clickGrabItNow(banner);

  // Wait for navigation specifically with both parameters
  await page.waitForURL(/.*\/vin-check\/.*type=vhr.*content=revisitBanner.*/);

  // 5. Verify URL contains '/vin-check/' and both query parameters
  await expect(page).toHaveURL(/.*\/vin-check\/.*type=vhr.*content=revisitBanner.*/);
  });

test('TC_05: Verify Window Sticker Revisit Banner', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);

  // 1. Perform VIN decode on window-sticker page
  await page.goto('/window-sticker');
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible('Window sticker found for');
  
  // 2. Go back
  await page.goBack();
  await page.waitForLoadState('load');
  
  // 3. Wait for banner to appear (up to 1 min as requested)
  // verifyRevisitBannerVisible now supports passing custom text and uses 60s timeout
  const banner = await home.verifyRevisitBannerVisible('Your window sticker for');
  await home.clickGrabItNow(banner);

  // 4. Verify URL specifically with required parameters: type=sticker & content=revisitBanner
  await page.waitForURL(/.*\/vin-check\/.*type=sticker.*content=revisitBanner.*/);
  await expect(page).toHaveURL(/.*\/vin-check\/.*type=sticker.*content=revisitBanner.*/);
});

test('TC_06: Verify Preview Page Plan Selection', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);

  // 1. Perform VIN decode
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();
  
  // 2. Define plans and iterate
  // Use partial names that match the start of the buttons
  const plans = ['1 Report', '2 Reports', '5 Reports', 'Unlimited VIN Check']; 
  for (const planName of plans) {
    console.log(`Selecting plan: ${planName}`);
    const plan = await preview.selectPlan(planName);
    
    // Verify it is selected
    await expect(plan).toHaveAttribute('aria-pressed', 'true');
  }
});
