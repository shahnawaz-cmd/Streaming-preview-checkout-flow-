// tests/streaming-e2e.spec.js
const { test, expect } = require('@playwright/test');
const { HomePage, EUVinDecoder } = require('./pages/HomePage');
const { PreviewPage, PreviewToCheckoutPriceValidator, EmailCache } = require('./pages/PreviewPage');
const { EUVinModifier } = require('./pages/EUVinModifier');
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

test('TC_14_Classic_Manual_Input_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);

  try {
    await home.navigate();
    await home.decodeVin('242370B111346');
    await expect.poll(
      async () => page.locator('body').innerText(),
      { timeout: TIMEOUT }
    ).toContain('Reveal records for this vehicle');

    await preview.ClassicEditibleSpecsManualInput();
    console.log('✅ [TC_14] Classic VIN Manual Input submitted');
  } finally {
    await page.close();
  }
});

test('TC_15_Classic_Editible_Specs_Update', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);

  try {
    await home.navigate();
    await home.decodeVin('242370B111346');
    await expect.poll(
      async () => page.locator('body').innerText(),
      { timeout: TIMEOUT }
    ).toContain('Reveal records for this vehicle');

    await preview.classicEditibleSpecsUpdateSpec();
    console.log('✅ [TC_15] Classic Editible Specs Update submitted');
  } finally {
    await page.close();
  }
});

test('TC_16_PayPal_Successful_Payment', async ({ page, context }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  const checkout = new CheckoutPage(page);
  
  const paypalCredentials = {
      email: process.env.PAYPAL_EMAIL,
      password: process.env.PAYPAL_PASSWORD
  };

  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.runCheckoutFlow();

  // Instant click on PayPal option
  await checkout.paypal.selectPayPalOption();
  
  // Wait 4s before clicking "Pay with PayPal"
  await page.waitForTimeout(4000);
  const popup = await checkout.paypal.clickPayPalButton(context, TIMEOUT);
  await checkout.paypal.loginPayPal(popup, paypalCredentials, TIMEOUT);
  await checkout.paypal.approvePayPalPayment(popup, TIMEOUT);

  await page.waitForURL(url => url.toString().includes('paid=true'), { timeout: 60000 });
  console.log('✅ [TC_16] PayPal successful payment complete');
});

test('TC_17_EU_VIN_Confirmation_No', async ({ page }) => {
  const home = new HomePage(page);
  const modifier = new EUVinModifier(page);
  
  await home.navigate();
  // Using a sample EU VIN as implied by the requirement
  await home.decodeVin('SHHEU88701U002018', 3);
  
  // Perform the EU modification flow
  await modifier.modifyEUVinByYMMUsingNo();

  // Add validation logic if needed
  console.log('✅ [TC_17] EU VIN Confirmation (No) flow completed');
  await page.close();
});

test('TC_18_Price_Consistency_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  const validator = new PreviewToCheckoutPriceValidator(page);

  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);

  // Select plan and handle upsell
  const selectedPlan = await validator.selectRandomPlanAndHandleUpsell();

  // Run checkout flow (handles email, phone, and navigation to checkout)
  await preview.runCheckoutFlow();

  // Navigate to checkout and validate order summary
  await validator.validateOrderSummary(selectedPlan);

  console.log('✅ [TC_18] Price consistency validation completed');
  await page.close();
});

test('TC_19_Email_Cache_Flow', async ({ page }) => {
  // Increased timeout to 120s to prevent flakiness in CI/local
  const tcTimeout = 120000;
  test.setTimeout(tcTimeout);

  const home = new HomePage(page);
  const cache = new EmailCache(page, tcTimeout);
  
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  
  await cache.Cacheemailbackfromcheckout();

  console.log('✅ [TC_19] Email Cache flow completed');
  await page.close();
});

test('TC_20_Default_Plan_Checking', async ({ page }) => {
  // Condition-based timeout
  const tcTimeout = process.env.CI ? 120000 : 60000;
  test.setTimeout(tcTimeout);

  const home = new HomePage(page);
  const { DefaultPlanCheckingHandler } = require('./pages/PreviewPage');
  const handler = new DefaultPlanCheckingHandler(page);
  
  await handler.sitesettingDefaultPlansVerifies(home);

  console.log('✅ [TC_20] Default plan checking completed');
  await page.close();
});

test('TC_21_Window_Sticker_Default_Plan', async ({ page }) => {
  // Condition-based timeout
  const tcTimeout = process.env.CI ? 120000 : 60000;
  test.setTimeout(tcTimeout);

  const home = new HomePage(page);
  const { DefaultPlanCheckingHandler } = require('./pages/PreviewPage');
  const handler = new DefaultPlanCheckingHandler(page);

  // Navigate to window-sticker instead of default home
  await page.goto('/window-sticker');
  await home.decodeVin('4JGED6EB0JA121264');
  
  // Reuse handler method, skip default home navigation, verify WS plan
  await handler.sitesettingDefaultPlansVerifies(home, '4JGED6EB0JA121264', true, 'ws');

  console.log('✅ [TC_21] Window sticker default plan checking completed');
  await page.close();
});
