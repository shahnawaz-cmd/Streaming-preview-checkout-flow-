// tests/pages/PreviewPage.js
const { expect } = require('@playwright/test');
const TIMEOUT = process.env.CI ? 90000 : 30000;

class PreviewPage {
  constructor(page) {
    this.page = page;
    // Use .first() to resolve ambiguity if multiple buttons match
    this.accessRecordButton = page.locator('button:has-text("Access Record")').first();
  }

  async handleEUSpecs(timeout = TIMEOUT) {
    await this.page.getByRole('button', { name: 'No, fix it' }).click();
    await this.page.waitForTimeout(17000);
    await this.page.getByRole('textbox', { name: 'Select year' }).click();
    await this.page.getByRole('button', { name: '2022' }).click();
    await this.page.getByRole('textbox', { name: 'Select make' }).click();
    await this.page.getByRole('button', { name: 'Acura' }).click();
    await this.page.getByRole('textbox', { name: 'Select model' }).click();
    await this.page.getByRole('button', { name: 'MDX' }).click();
    await this.page.getByRole('textbox', { name: 'Select trim' }).click();
    await this.page.getByRole('button', { name: 'V6 FWD - V6' }).click();
    await this.page.getByRole('button', { name: 'Get Records' }).click();
  }

  async confirmSpecs() {
    // Add logic here
  }

  async selectPlan(planName) {
    // Specifically target the container div acting as a button for the plan
    const plan = this.page.locator(`div[role="button"]:has(div:has-text("${planName}"))`).first();
    
    // Explicit wait for interactability
    await plan.waitFor({ state: 'visible', timeout: TIMEOUT });
    
    // Click the plan
    await plan.click();
    
    // Verify it is selected by checking aria-pressed attribute (in the test file)
    return plan;
  }

  async verifySpecsVisible(expectedText = 'Records found for', timeout = TIMEOUT) {
    // Wait for the specific text to appear
    await this.page.waitForSelector(`text=${expectedText}`, { timeout: timeout });
  }

  async verifyAccessRecordButton() {
    await this.accessRecordButton.waitFor({ state: 'visible', timeout: TIMEOUT });
    await this.accessRecordButton.isEnabled();
  }

  async clickAccessRecordButton() {
    await this.accessRecordButton.click();
  }

  async closeAccessRecordPopup() {
    const closeButton = this.page.getByRole('button', { name: /^Close$/ }).first();
    await closeButton.waitFor({ state: 'visible', timeout: TIMEOUT });
    await closeButton.click();
    await closeButton.waitFor({ state: 'hidden', timeout: TIMEOUT });
  }

  async triggerExitIntent() {
    await this.page.mouse.move(640, 400, { steps: 10 });
    await this.page.waitForTimeout(1000);
    await this.page.mouse.wheel(0, 500);
    await this.page.waitForTimeout(500);
    await this.page.mouse.wheel(0, -500);
    await this.page.waitForTimeout(500);

    await this.page.mouse.move(400, 600, { steps: 10 });
    await this.page.waitForTimeout(300);
    await this.page.mouse.move(400, 400, { steps: 10 });
    await this.page.waitForTimeout(300);
    await this.page.mouse.move(400, 200, { steps: 15 });
    await this.page.waitForTimeout(300);
    await this.page.mouse.move(400, 100, { steps: 15 });
    await this.page.waitForTimeout(300);
    await this.page.mouse.move(400, 10,  { steps: 10 });
    await this.page.waitForTimeout(300);

    await this.page.evaluate(() => {
      const opts = { bubbles: true, cancelable: true, clientX: 400, clientY: -1 };
      document.dispatchEvent(new MouseEvent('mouseleave', opts));
      document.dispatchEvent(new MouseEvent('mouseout',   opts));
      window.dispatchEvent(new MouseEvent('mouseleave',   opts));
      document.documentElement.dispatchEvent(new MouseEvent('mouseleave', opts));
    });

    await this.page.waitForTimeout(3000);
  }

  async verifyAndRedeemExitOffer() {
    // Redeem 15% off
    await this.page.getByRole('button', { name: 'Redeem 15% off' }).click();
  }

  async classicEdtibleFeatureYMM() {
    await this.page.getByRole('button', { name: 'Click here to update' }).click();
    await this.page.getByRole('button', { name: 'Year, Make & Model The' }).click();

    // Explicit 30s delay to allow popup stabilization as requested
    await this.page.waitForTimeout(30000);

    await this.page.getByRole('textbox', { name: 'Select year' }).click();
    await this.page.getByRole('button', { name: '1923' }).click();

    await this.page.getByRole('textbox', { name: 'Select make' }).click();
    await this.page.getByRole('button', { name: 'Ambassador' }).click();

    await this.page.getByRole('textbox', { name: 'Select model' }).click();
    await this.page.getByRole('button', { name: 'R', exact: true }).click();

    await this.page.getByRole('textbox', { name: 'Select trim' }).click();
    await this.page.getByRole('button', { name: 'Touring' }).click();

    await this.page.getByRole('button', { name: 'Continue' }).click();
    await this.page.getByRole('button', { name: 'Confirm & Get Records' }).click();
  }

  async ClassicEditibleSpecsManualInput(timeout = TIMEOUT) {
    await this.page.getByRole('button', { name: 'Click here to update' }).click();
    await this.page.getByRole('button', { name: 'Year, Make & Model The' }).click();
    await this.page.getByRole('button', { name: 'Click here', exact: true }).click();
    
    await this.page.getByRole('textbox', { name: 'Year' }).click();
    await this.page.getByRole('textbox', { name: 'Year' }).fill('1950', { timeout });
    await this.page.getByRole('textbox', { name: 'Make' }).click();
    await this.page.getByRole('textbox', { name: 'Make' }).fill('Ford', { timeout });
    await this.page.getByRole('textbox', { name: 'Model' }).click();
    await this.page.getByRole('textbox', { name: 'Model' }).fill('F-150', { timeout });
    await this.page.getByRole('textbox', { name: 'Engine' }).click();
    await this.page.getByRole('textbox', { name: 'Engine' }).fill('V9', { timeout });
    await this.page.getByRole('textbox', { name: 'Transmission' }).click();
    await this.page.getByRole('textbox', { name: 'Transmission' }).fill('Auto', { timeout });
    await this.page.getByRole('textbox', { name: 'Number of Doors' }).click();
    await this.page.getByRole('textbox', { name: 'Number of Doors' }).fill('4', { timeout });
    await this.page.getByRole('textbox', { name: 'Drive Type' }).click();
    await this.page.getByRole('textbox', { name: 'Drive Type' }).fill('AWD', { timeout });
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  async classicEditibleSpecsUpdateSpec(timeout = TIMEOUT) {
    await this.page.getByRole('button', { name: 'Click here to update' }).click();
    await this.page.getByRole('button', { name: 'Specifications Engine,' }).click();
    
    await this.page.getByRole('textbox', { name: 'Axle Type' }).click();
    await this.page.getByRole('textbox', { name: 'Axle Type' }).fill('Semifloating asdfsss', { timeout });
    await this.page.getByRole('textbox', { name: 'Body Maker' }).click();
    await this.page.getByRole('textbox', { name: 'Body Maker' }).fill('Fisher asdsss', { timeout });
    await this.page.getByRole('textbox', { name: 'Cylinders' }).click();
    await this.page.getByRole('textbox', { name: 'Cylinders' }).fill('8 3333', { timeout });
    await this.page.getByRole('textbox', { name: 'Displacement' }).click();
    await this.page.getByRole('textbox', { name: 'Displacement' }).fill('330 cu. in. 22222', { timeout });
    await this.page.getByRole('textbox', { name: 'Front Tread' }).click();
    await this.page.getByRole('textbox', { name: 'Front Tread' }).fill('61.8 inches asdasd', { timeout });
    await this.page.getByRole('textbox', { name: 'Fuel' }).click();
    await this.page.getByRole('textbox', { name: 'Fuel' }).fill('25 Gallons sdadad', { timeout });
    await this.page.getByRole('textbox', { name: 'Height' }).click();
    await this.page.getByRole('textbox', { name: 'Height' }).fill('55.5 inches adasd', { timeout });
    await this.page.getByRole('textbox', { name: 'Length' }).click();
    await this.page.getByRole('textbox', { name: 'Length' }).fill('217 inches adasd', { timeout });
    
    await this.page.getByRole('button', { name: 'Continue' }).click();
    await this.page.getByRole('button', { name: 'Confirm & Get Records' }).click();
  }

  async runCheckoutFlow() {
    // 1. Click Access Record
    await this.clickAccessRecordButton();

    // 2. Wait for email popup and fill details
    const emailInput = this.page.locator('input[type="email"]').first();
    const phoneInput = this.page.locator('input[type="tel"]').first();
    
    await emailInput.waitFor({ state: 'visible', timeout: TIMEOUT });
    
    await emailInput.fill(PreviewPage.generateUniqueEmail());
    await phoneInput.fill(PreviewPage.generateUsPhoneNumber());
    
    // 3. Click Proceed to checkout and wait for the navigation together
    await Promise.all([
      this.page.waitForURL(/.*\/checkout(?:-\d+)?.*/, { timeout: TIMEOUT }),
      this.page.getByRole('button', { name: /proceed to checkout/i }).click(),
    ]);
  }

  // Helper: Generate a unique email
  static generateUniqueEmail() {
    return `test_${Date.now()}@example.com`;
  }

  // Helper: Generate a valid US phone number (XXX) XXX-XXXX
  static generateUsPhoneNumber() {
    const areaCode = Math.floor(Math.random() * 800) + 200; // 200-999
    const prefix = Math.floor(Math.random() * 800) + 200;   // 200-999
    const lineNumber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }
}

class PreviewToCheckoutPriceValidator {
  constructor(page) {
    this.page = page;
  }

  async selectRandomPlanAndHandleUpsell() {
    // Select plan by name only, ignoring dynamic price/currency
    const plans = [
      { name: '1 Report', reports: 1, locator: this.page.locator('div[role="button"]').filter({ hasText: /^1 Report/ }) },
      { name: '2 Reports', reports: 2, locator: this.page.locator('div[role="button"]').filter({ hasText: /^2 Reports/ }) },
      { name: '5 Reports', reports: 5, locator: this.page.locator('div[role="button"]').filter({ hasText: /^5 Reports/ }) },
      { name: 'Unlimited VIN Check', reports: 0, locator: this.page.locator('div[role="button"]').filter({ hasText: /^Unlimited VIN Check/ }) }
    ];

    const randomPlan = plans[Math.floor(Math.random() * plans.length)];
    
    // Capture price from the plan element itself dynamically
    const priceText = await randomPlan.locator.innerText();
    const priceMatch = priceText.match(/\$\d+(\.\d{2})?/);
    const perReportPrice = priceMatch ? parseFloat(priceMatch[0].replace('$', '')) : 0;
    
    // Calculate total price: if reports > 0, multiply, else just take the base price
    const totalPlanPrice = randomPlan.reports > 0 ? (perReportPrice * randomPlan.reports).toFixed(2) : perReportPrice.toFixed(2);
    
    await randomPlan.locator.click();
    console.log(`✅ Selected plan: ${randomPlan.name}, Per-Report Price: $${perReportPrice}, Total Price: $${totalPlanPrice}`);

    // Handle Upsell
    let upsellPrice = null;
    const upsellCheckbox = this.page.getByRole('checkbox', { name: /Save 50%! Get a window/ });
    
    if (randomPlan.name !== 'Unlimited VIN Check') {
      const upsellContainer = upsellCheckbox.locator('xpath=..'); // Adjust if needed
      const upsellText = await upsellContainer.innerText();
      const upsellMatch = upsellText.match(/\$\d+(\.\d{2})?/);
      upsellPrice = upsellMatch ? upsellMatch[0].replace('$', '') : null;
      
      await upsellCheckbox.check();
      console.log(`✅ Upsell selected. Price: $${upsellPrice}`);
    } else {
      console.log('ℹ️ UVC plan selected: Upsell hidden.');
    }

    return { planName: randomPlan.name, totalPlanPrice, upsellPrice };
  }

  async validateOrderSummary(selectedData) {
    // Navigate to checkout if not already there
    if (!this.page.url().includes('/checkout')) {
      const checkoutButton = this.page.getByRole('button', { name: /proceed to checkout/i });
      await checkoutButton.waitFor({ state: 'visible', timeout: TIMEOUT });
      await checkoutButton.click({ force: true });
      await this.page.waitForURL(/.*\/checkout.*/);
    }

    // Locate Order Summary container
    const orderSummary = this.page.locator('aside:has(h2:has-text("Order summary"))');

    // Calculate expected total
    const planPrice = parseFloat(selectedData.totalPlanPrice);
    const upsellPrice = selectedData.upsellPrice ? parseFloat(selectedData.upsellPrice) : 0;
    const expectedTotal = planPrice + upsellPrice;

    // Validate Package
    // Refined to target the specific grid item containing the package name
    // Use a robust locator and handle the known typo "Unmimited" in the UI
    const packageItem = orderSummary.locator('div:has-text("Package") ~ div span').first();
    
    // Create a regex that handles the typo
    const planNameRegex = selectedData.planName.replace('Unlimited', 'Unm?imited');
    await expect(packageItem).toHaveText(new RegExp(planNameRegex, 'i'));
    
    // Validate Total Price (specific selector from HTML)
    const totalLocator = orderSummary.locator('span:has-text("Total") + div span');
    await expect(totalLocator).toBeVisible();
    
    const totalText = await totalLocator.innerText();
    const foundTotal = parseFloat(totalText.replace('$', ''));
    
    // Compare with tolerance
    expect(Math.abs(foundTotal - expectedTotal), `Total price mismatch. Expected $${expectedTotal}, found $${foundTotal}`).toBeLessThan(0.05);
    
    console.log(`✅ Total price $${foundTotal} verified in Order summary.`);

    // Validate Add-on (if applicable)
    if (selectedData.planName !== 'Unlimited VIN Check' && selectedData.upsellPrice) {
      // Specifically target the Add-on label to avoid strict mode violations
      const addonLabel = orderSummary.locator('div.inline-flex:has-text("Add-on")');
      await expect(addonLabel).toBeVisible();
      console.log('✅ Add-on verified in Order summary.');
    } else {
      await expect(orderSummary.locator('div:has-text("Add-on")')).not.toBeVisible();
      console.log('✅ No Add-on as expected for UVC.');
    }
  }
}

class EmailCache {
  constructor(page, timeout = TIMEOUT) {
    this.page = page;
    this.timeout = timeout;
    this.preview = new PreviewPage(page);
    this.validator = new PreviewToCheckoutPriceValidator(page);
  }

  async Cacheemailbackfromcheckout() {
    console.log("--- Starting TC_19 Email Cache Flow ---");
    
    // 1. Run checkout flow
    await this.preview.runCheckoutFlow();
    console.log("✅ Landed on checkout page (1st time)");

    // 2. Go back
    await this.page.goBack();
    await this.page.waitForLoadState('load');
    console.log("✅ Navigated back to Preview page");

    // 3. Select new plan
    const newData = await this.validator.selectRandomPlanAndHandleUpsell();
    
    // 4. Click Access Record (Expect NO email popup)
    await this.preview.clickAccessRecordButton();
    await this.page.waitForURL(/.*\/checkout.*/, { timeout: this.timeout });
    
    // Check that email popup is NOT visible
    const emailInput = this.page.locator('input[type="email"]');
    await expect(emailInput).not.toBeVisible({ timeout: 5000 });
    console.log("✅ Email popup did NOT appear, directly navigated");

    // 5. Validate Order Summary updated
    await this.validator.validateOrderSummary(newData);
    console.log("✅ Order summary updated correctly");
    
    return true;
  }
}

module.exports = { PreviewPage, PreviewToCheckoutPriceValidator, EmailCache };
