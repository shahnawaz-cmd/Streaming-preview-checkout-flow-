// tests/streaming-e2e.spec.js
const { test, expect } = require('@playwright/test');
const { HomePage } = require('./pages/HomePage');
const { PreviewPage } = require('./pages/PreviewPage');
const { CheckoutPage } = require('./pages/CheckoutPage');
const { ApiResponseCapture } = require('./helpers/responseCapture');

const TIMEOUT = 60000; // Define timeout for test spec

test('TC_01_VIN_Decode_17_Character_Validation', async ({ page }) => {
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
  await preview.closeAccessRecordPopup();
});

test('TC_02_VIN_Decode_Classic_Validation', async ({ page }) => {
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
  await preview.closeAccessRecordPopup();
});

test('TC_04_Revisit_Banner_Interaction_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);

  // 1. Perform TC_01 flow
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();
  
  // 2. Go back
  await page.goBack();
  await page.waitForLoadState('load');
  
  console.log('Navigated back to Home:', page.url());

  // 4. Verify Revisit banner and click "Grab it now"
  // Revisit banner is verified by its visibility, not time.
  const banner = await home.verifyRevisitBannerVisible();
  await home.clickGrabItNow(banner);

  // Wait for navigation specifically with both parameters
  await page.waitForURL(/.*\/vin-check\/.*type=vhr.*content=revisitBanner.*/);

  // 5. Verify URL contains '/vin-check/' and both query parameters
  await expect(page).toHaveURL(/.*\/vin-check\/.*type=vhr.*content=revisitBanner.*/);
  });

test('TC_05_Window_Sticker_Revisit_Banner_Validation', async ({ page }) => {
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

test('TC_06_Preview_Page_Plan_Selection_Validation', async ({ page }) => {
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

test('TC_07_Exit_Intent_Popup_Trigger_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);

  // 1. Perform VIN decode
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();

  // 2. Trigger exit intent
  await preview.triggerExitIntent();

  // 3. Verify banner, redeem, and check URL for 'offer'
  await preview.verifyAndRedeemExitOffer();
  
  // Verify '% OFF' is visible (assertion performed in test file)
  await expect(page.getByText('% OFF')).toBeVisible({ timeout: 60000 });
  
  await expect(page).toHaveURL(/.*offer=.*/);
});

test('TC_08_Home_To_Checkout_Flow_Integration_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  const checkout = new CheckoutPage(page);

  // 1. Perform VIN decode flow
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();

  // 2. Run checkout flow helper
  await preview.runCheckoutFlow();

  // 3. Verify landed on checkout
  await expect(page).toHaveURL(/.*\/checkout.*/);
  console.log('✅ [TC_08] Successfully landed on checkout page');
});

test('TC_09_Full_Checkout_Flow_Stripe_Visa_US_Validation', async ({ page }, testInfo) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  const checkout = new CheckoutPage(page);

  const apiCapture = new ApiResponseCapture(page, TIMEOUT);

  // 1. VIN Decode Flow
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();

  // 2. Access Record & Checkout Flow
  await preview.runCheckoutFlow();
  await expect(page).toHaveURL(/.*\/checkout.*/);

  // 3. Complete Checkout Flow with Stripe Visa US
  await Promise.all([
    checkout.completeCheckoutProcess('visa_us'),
    page.waitForURL(/.*\/success.*/, { timeout: TIMEOUT }),
    apiCapture.waitForStripePaymentIntent(),
    apiCapture.waitForPaymentUpdate(),
  ]);

  // Attach responses to Playwright report
  if (apiCapture.stripeResponses.length > 0) {
    await testInfo.attach('stripe_response', {
      body: JSON.stringify(apiCapture.stripeResponses, null, 2),
      contentType: 'application/json',
    });
  }
  if (apiCapture.paymentUpdateResponses.length > 0) {
    await testInfo.attach('payment_update_response', {
      body: JSON.stringify(apiCapture.paymentUpdateResponses, null, 2),
      contentType: 'application/json',
    });
  } else {
    await testInfo.attach('payment_update_response', {
      body: JSON.stringify({ message: 'No payment-update response captured' }, null, 2),
      contentType: 'application/json',
    });
  }

  // 4. Final validation
  const memberAreaUrlPattern = /.*\/dashboard\?vin=[^&]+&generate=true&paid=true#vehicle-history-report/;

  await page.waitForURL(memberAreaUrlPattern, { timeout: TIMEOUT });
  await expect(page).toHaveURL(memberAreaUrlPattern);

  console.log('✅ [TC_09] Successfully completed full checkout flow, verified success page, and attached API responses to report');
  await page.close();
});

test('TC_10_Full_Window_Sticker_Checkout_Flow_Stripe_Visa_US_Validation', async ({ page }, testInfo) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  const checkout = new CheckoutPage(page);

  const apiCapture = new ApiResponseCapture(page, TIMEOUT);

  const vin = process.env.TC_10_VIN || '4JGED6EB0JA121264';

  await page.goto('/window-sticker');
  await home.decodeVin(vin, 3);
  await preview.verifySpecsVisible('Window sticker found for');

  await preview.runCheckoutFlow();
  await expect(page).toHaveURL(/.*\/checkout.*/);

  await Promise.all([
    checkout.completeCheckoutProcess('visa_us'),
    page.waitForURL(/.*\/success.*/, { timeout: TIMEOUT }),
    apiCapture.waitForStripePaymentIntent(),
    apiCapture.waitForPaymentUpdate(),
  ]);

  if (apiCapture.stripeResponses.length > 0) {
    await testInfo.attach('stripe_response', {
      body: JSON.stringify(apiCapture.stripeResponses, null, 2),
      contentType: 'application/json',
    });
  }
  if (apiCapture.paymentUpdateResponses.length > 0) {
    await testInfo.attach('payment_update_response', {
      body: JSON.stringify(apiCapture.paymentUpdateResponses, null, 2),
      contentType: 'application/json',
    });
  } else {
    await testInfo.attach('payment_update_response', {
      body: JSON.stringify({ message: 'No payment-update response captured' }, null, 2),
      contentType: 'application/json',
    });
  }

  const windowStickerUrlPattern = /.*\/dashboard\?vin=[^&]+&generate=true&paid=true#window-sticker/;

  await page.waitForURL(windowStickerUrlPattern, { timeout: TIMEOUT });
  await expect(page).toHaveURL(windowStickerUrlPattern);

  console.log('✅ [TC_10] Successfully completed window sticker checkout flow, verified success page, and attached API responses to report');
  await page.close();
});

test('TC_11_Full_Checkout_Flow_Stripe_Generic_Decline_Validation', async ({ page }, testInfo) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  const checkout = new CheckoutPage(page);

  const apiCapture = new ApiResponseCapture(page, TIMEOUT);

  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();

  await preview.runCheckoutFlow();
  await expect(page).toHaveURL(/.*\/checkout.*/);

  await Promise.all([
    checkout.completeCheckoutProcess('generic_decline'),
    apiCapture.waitForStripePaymentIntent(),
    checkout.waitForPaymentFailureAndClose(),
  ]);

  if (apiCapture.stripeResponses.length > 0) {
    await testInfo.attach('stripe_response', {
      body: JSON.stringify(apiCapture.stripeResponses, null, 2),
      contentType: 'application/json',
    });
  }

  await expect(page).not.toHaveURL(/.*\/success.*/);

  console.log('✅ [TC_11] Decline card returned API response, showed front-end error, and did not complete payment');
  await page.close();
});

test('TC_12_Full_Checkout_Flow_Stripe_3DS_Validation', async ({ page }, testInfo) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  const checkout = new CheckoutPage(page);
  const apiCapture = new ApiResponseCapture(page, TIMEOUT);

  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();

  await preview.runCheckoutFlow();
  await expect(page).toHaveURL(/.*\/checkout.*/);

  await Promise.all([
    checkout.completeCheckoutProcess('stripe_3ds'),
    apiCapture.waitForStripePaymentIntent(),
    apiCapture.waitForThreeDSAuthenticate(),
  ]);

  await Promise.all([
    checkout.complete3DSChallenge(),
    apiCapture.waitForStripeResponseByUrlPart('/v1/payment_intents/'),
    apiCapture.waitForPaymentUpdate({ okOnly: false }),
    page.waitForURL(/.*\/(success|success-page).*/, { timeout: TIMEOUT }),
  ]);

  if (apiCapture.stripeResponses.length > 0) {
    await testInfo.attach('stripe_response', {
      body: JSON.stringify(apiCapture.stripeResponses, null, 2),
      contentType: 'application/json',
    });
  }

  if (apiCapture.threeDSResponses.length > 0) {
    await testInfo.attach('three_ds_response', {
      body: JSON.stringify(apiCapture.threeDSResponses, null, 2),
      contentType: 'application/json',
    });
  }

  await expect(page).toHaveURL(/.*\/(success|success-page).*/);

  console.log('✅ [TC_12] 3DS card completed challenge, captured API responses, and reached success');
  await page.close();
});

test('TC_13_Classic_VIN_YMM_Edit_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);

  try {
    await home.navigate();
    await home.decodeVin('242370B111346');
    await expect.poll(
      async () => page.locator('body').innerText(),
      { timeout: TIMEOUT }
    ).toContain('Reveal records for this vehicle');

    await preview.classicEdtibleFeatureYMM();
    console.log('✅ [TC_13] Classic VIN YMM edit submitted');
  } finally {
    await page.close();
  }
});
