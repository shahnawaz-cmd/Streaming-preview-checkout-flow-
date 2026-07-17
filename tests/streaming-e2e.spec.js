// tests/streaming-e2e.spec.js
const { test, expect } = require('@playwright/test');
const { HomePage, EUVinDecoder } = require('./pages/HomePage');
const { PreviewPage, PreviewToCheckoutPriceValidator, EmailCache, DefaultPlanCheckingHandler, UpsellTextMatched } = require('./pages/PreviewPage');
const { EUVinModifier } = require('./pages/EUVinModifier');
const { CheckoutPage } = require('./pages/CheckoutPage');
const { ApiResponseCapture } = require('./helpers/responseCapture');

const TIMEOUT = 60000; // Define timeout for test spec

test('TC_01_VIN_Decode_17_Character_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();
  await preview.verifyAccessRecordButton();
  await preview.clickAccessRecordButton();
  await preview.closeAccessRecordPopup();
  await page.close();
});

test('TC_02_VIN_Decode_Classic_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  await home.navigate();
  await home.decodeVin('223870L108421');
  await preview.verifySpecsVisible('Records found for', 60000);
  await preview.verifyAccessRecordButton();
  await preview.clickAccessRecordButton();
  await preview.closeAccessRecordPopup();
  await page.close();
});

test('TC_04_Revisit_Banner_Interaction_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();
  await page.goBack();
  await page.waitForLoadState('load');
  const banner = await home.verifyRevisitBannerVisible();
  await home.clickGrabItNow(banner);
  await page.waitForURL(/.*\/vin-check\/.*type=vhr.*content=revisitBanner.*/);
  await expect(page).toHaveURL(/.*\/vin-check\/.*type=vhr.*content=revisitBanner.*/);
  await page.close();
});

test('TC_05_Window_Sticker_Revisit_Banner_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  await page.goto('/window-sticker');
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible('Window sticker found for');
  await page.goBack();
  await page.waitForLoadState('load');
  const banner = await home.verifyRevisitBannerVisible('Your window sticker for');
  await home.clickGrabItNow(banner);
  await page.waitForURL(/.*\/vin-check\/.*type=sticker.*content=revisitBanner.*/);
  await expect(page).toHaveURL(/.*\/vin-check\/.*type=sticker.*content=revisitBanner.*/);
  await page.close();
});

test('TC_06_Preview_Page_Plan_Selection_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();
  const plans = ['1 Report', '2 Reports', '5 Reports', 'Unlimited VIN Check']; 
  for (const planName of plans) {
    const plan = await preview.selectPlan(planName);
    await expect(plan).toHaveAttribute('aria-pressed', 'true');
  }
  await page.close();
});

test('TC_07_Exit_Intent_Popup_Trigger_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();
  await preview.triggerExitIntent();
  await preview.verifyAndRedeemExitOffer();
  await expect(page.getByText('% OFF')).toBeVisible({ timeout: 60000 });
  await expect(page).toHaveURL(/.*offer=.*/);
  await page.close();
});

test('TC_08_Home_To_Checkout_Flow_Integration_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();
  await preview.runCheckoutFlow();
  await expect(page).toHaveURL(/.*\/checkout.*/);
  await page.close();
});

test('TC_09_Full_Checkout_Flow_Stripe_Visa_US_Validation', async ({ page }, testInfo) => {
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
    checkout.completeCheckoutProcess('visa_us'),
    page.waitForURL(/.*\/success.*/, { timeout: TIMEOUT }),
    apiCapture.waitForStripePaymentIntent(),
    apiCapture.waitForPaymentUpdate(),
  ]);
  await page.waitForURL(/.*\/dashboard\?vin=[^&]+&generate=true&paid=true#vehicle-history-report/, { timeout: TIMEOUT });
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
  await page.waitForURL(/.*\/dashboard\?vin=[^&]+&generate=true&paid=true#window-sticker/, { timeout: TIMEOUT });
  await page.close();
});

test('TC_11_Full_Checkout_Flow_Stripe_Generic_Decline_Validation', async ({ page }, testInfo) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  const checkout = new CheckoutPage(page);
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.verifySpecsVisible();
  await preview.runCheckoutFlow();
  await expect(page).toHaveURL(/.*\/checkout.*/);
  await Promise.all([
    checkout.completeCheckoutProcess('generic_decline'),
    checkout.waitForPaymentFailureAndClose(),
  ]);
  await expect(page).not.toHaveURL(/.*\/success.*/);
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
    page.waitForURL(/.*\/(success|success-page).*/, { timeout: TIMEOUT }),
  ]);
  await expect(page).toHaveURL(/.*\/(success|success-page).*/);
  await page.close();
});

test('TC_13_Classic_VIN_YMM_Edit_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  try {
    await home.navigate();
    await home.decodeVin('242370B111346');
    await preview.classicEdtibleFeatureYMM();
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
    await preview.ClassicEditibleSpecsManualInput();
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
    await preview.classicEditibleSpecsUpdateSpec();
  } finally {
    await page.close();
  }
});

test('TC_16_PayPal_Successful_Payment', async ({ page, context }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  const checkout = new CheckoutPage(page);
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await preview.runCheckoutFlow();
  await checkout.paypal.selectPayPalOption();
  await page.waitForTimeout(4000);
  const popup = await checkout.paypal.clickPayPalButton(context, TIMEOUT);
  await checkout.paypal.loginPayPal(popup, {email: process.env.PAYPAL_EMAIL, password: process.env.PAYPAL_PASSWORD}, TIMEOUT);
  await checkout.paypal.approvePayPalPayment(popup, TIMEOUT);
  await page.waitForURL(url => url.toString().includes('paid=true'), { timeout: 60000 });
  await page.close();
});

test('TC_17_EU_VIN_Confirmation_No', async ({ page }) => {
  const home = new HomePage(page);
  const modifier = new EUVinModifier(page);
  await home.navigate();
  await home.decodeVin('SHHEU88701U002018', 3);
  await modifier.modifyEUVinByYMMUsingNo();
  await page.close();
});

test('TC_18_Price_Consistency_Validation', async ({ page }) => {
  const home = new HomePage(page);
  const preview = new PreviewPage(page);
  const validator = new PreviewToCheckoutPriceValidator(page);
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  const selectedPlan = await validator.selectRandomPlanAndHandleUpsell();
  await preview.runCheckoutFlow();
  await validator.validateOrderSummary(selectedPlan);
  await page.close();
});

test('TC_19_Email_Cache_Flow', async ({ page }) => {
  const tcTimeout = 120000;
  test.setTimeout(tcTimeout);
  const home = new HomePage(page);
  const cache = new EmailCache(page, tcTimeout);
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await cache.Cacheemailbackfromcheckout();
  await page.close();
});

test('TC_20_Default_Plan_Checking', async ({ page }) => {
  const tcTimeout = process.env.CI ? 120000 : 60000;
  test.setTimeout(tcTimeout);
  const home = new HomePage(page);
  const handler = new DefaultPlanCheckingHandler(page);
  await handler.sitesettingDefaultPlansVerifies(home);
  await page.close();
});

test('TC_21_Window_Sticker_Default_Plan', async ({ page }) => {
  const tcTimeout = process.env.CI ? 120000 : 60000;
  test.setTimeout(tcTimeout);
  const home = new HomePage(page);
  const handler = new DefaultPlanCheckingHandler(page);
  await page.goto('/window-sticker');
  await home.decodeVin('4JGED6EB0JA121264');
  await handler.sitesettingDefaultPlansVerifies(home, '4JGED6EB0JA121264', true, 'ws');
  await page.close();
});

test('TC_22_VHR_Upsell_Text_Validation', async ({ page }) => {
  const tcTimeout = process.env.CI ? 120000 : 60000;
  test.setTimeout(tcTimeout);
  const home = new HomePage(page);
  const upsellHandler = new UpsellTextMatched(page);
  await home.navigate();
  await home.decodeVin('4JGED6EB0JA121898', 3);
  await page.waitForURL(/.*\/preview.*/, { timeout: tcTimeout });
  await upsellHandler.upsellTextVerify('vhr', tcTimeout);
  await page.close();
});

test('TC_23_Sticker_Upsell_Text_Validation', async ({ page }) => {
  const tcTimeout = process.env.CI ? 120000 : 60000;
  test.setTimeout(tcTimeout);
  const home = new HomePage(page);
  const upsellHandler = new UpsellTextMatched(page);
  await page.goto('/window-sticker');
  await home.decodeVin('4JGED6EB0JA121264');
  await page.waitForURL(/.*\/preview.*/, { timeout: tcTimeout });
  await upsellHandler.upsellTextVerify('sticker', tcTimeout);
  await page.close();
});
