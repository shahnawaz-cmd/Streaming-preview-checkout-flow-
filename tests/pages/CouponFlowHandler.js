// tests/pages/CouponFlowHandler.js
const { expect } = require('@playwright/test');
const { PreviewPage, PreviewToCheckoutPriceValidator } = require('./PreviewPage');

const TIMEOUT = process.env.CI ? 90000 : 60000;

class CouponFlowHandler {
  constructor(page) {
    this.page = page;
    this.preview = new PreviewPage(page);
    this.validator = new PreviewToCheckoutPriceValidator(page);
    this.selectedData = null;
  }

  async navigateAndApplyCoupon(homeInstance, vin, timeout = TIMEOUT) {
    await homeInstance.navigate();
    await homeInstance.decodeVin(vin);
    await this.page.goto(this.page.url() + '&offer=testing');
    await this.page.reload(); // Refresh the page after applying coupon via URL
    await this.page.waitForURL(/.*\/preview.*/, { timeout });
  }

  async selectPlanAndUpsell() {
    this.selectedData = await this.validator.selectRandomPlanAndHandleUpsell();
    return this.selectedData;
  }

  async accessRecord() {
    await this.preview.clickAccessRecordButton();
  }

  async fillCheckoutDetails() {
    const emailInput = this.page.locator('input[type="email"]').first();
    const phoneInput = this.page.locator('input[type="tel"]').first();
    
    await emailInput.waitFor({ state: 'visible', timeout: TIMEOUT });
    
    await emailInput.fill(PreviewPage.generateUniqueEmail());
    await phoneInput.fill(PreviewPage.generateUsPhoneNumber());
    
    await Promise.all([
      this.page.waitForURL(/.*\/checkout(?:-\d+)?.*/, { timeout: TIMEOUT }),
      this.page.getByRole('button', { name: /proceed to checkout/i }).click(),
    ]);
  }

  async verifyOrderSummary(couponCode, couponPercentage = 0.50) {
    // 1. Verify coupon application text on checkout page
    // The text is like: "get20 applied — 20% off"
    // Using a regex to match: <couponCode> applied — <percentage>% off
    const percent = Math.round(couponPercentage * 100);
    const couponRegex = new RegExp(`${couponCode}\\s+applied\\s+—\\s+${percent}%\\s+off`, 'i');
    
    const couponMessage = this.page.locator(`text=${couponRegex}`);
    await couponMessage.waitFor({ state: 'visible', timeout: TIMEOUT });
    await expect(couponMessage).toBeVisible();
    console.log(`✅ [CouponFlow] Coupon message verified: "${await couponMessage.innerText()}"`);

    // 2. Existing order summary verification
    const baseTotal = parseFloat(this.selectedData.totalPlanPrice) + (this.selectedData.upsellPrice ? parseFloat(this.selectedData.upsellPrice) : 0);
    const discountedTotal = (baseTotal * (1 - couponPercentage)).toFixed(2);
    const discountedData = { ...this.selectedData, totalPlanPrice: discountedTotal, upsellPrice: null };

    await this.validator.validateOrderSummary(discountedData);
    console.log(`✅ [CouponFlow] Order summary verified. Expected Discounted Total: ${discountedTotal}`);
  }
}

class CheckoutCouponFlowTest {
  constructor(page) {
    this.page = page;
    this.preview = new PreviewPage(page);
  }

  async navigateToCheckout(homeInstance, vin, timeout = TIMEOUT) {
    // This flow intentionally does not add offer=testing to the preview URL.
    await homeInstance.navigate();
    await homeInstance.decodeVin(vin, 3);
    await this.preview.verifySpecsVisible('Records found for', timeout);
    await this.preview.runCheckoutFlow();
    await expect(this.page).toHaveURL(/.*\/checkout(?:-\d+)?.*/, { timeout });
  }
}

class CouponFlowVerifier {
  constructor(page) {
    this.page = page;
  }

  async applyCoupon(couponCode, couponPercentage) {
    const promoCodeInput = this.page.getByRole('textbox', { name: 'Promo code' });
    await promoCodeInput.fill(couponCode);
    await this.page.getByRole('button', { name: 'Apply', exact: true }).click();

    const percent = Math.round(couponPercentage * 100);
    await expect(
      this.page.getByText(new RegExp(`Coupon\\s+${couponCode}\\s+applied\\s+.*${percent}%\\s+off`, 'i'))
    ).toBeVisible({ timeout: TIMEOUT });
  }

  async verifyCheckoutTotals(couponPercentage) {
    const orderSummary = this.page.locator('aside').filter({
      has: this.page.getByRole('heading', { name: 'Order summary' }),
    });
    await expect(orderSummary).toBeVisible({ timeout: TIMEOUT });

    const summaryText = await orderSummary.innerText();
    const reportPrice = this.getLabeledAmount(summaryText, /Report[\s\S]*?(?:[A-Z]{3}\s*)?([\d.,]+)/i, 'Report');
    const discountAmount = this.getLabeledAmount(summaryText, /Discount[\s\S]*?-?\s*(?:[A-Z]{3}\s*)?([\d.,]+)/i, 'Discount');
    const addOnAmount = this.getOptionalAddOnAmount(summaryText);
    const totalAmount = this.getDiscountedTotal(summaryText);
    const expectedDiscount = reportPrice * couponPercentage;
    const expectedTotal = reportPrice - discountAmount + addOnAmount;

    expect(
      Math.abs(discountAmount - expectedDiscount),
      `Coupon discount mismatch. Expected ${expectedDiscount.toFixed(2)}, found ${discountAmount.toFixed(2)}`
    ).toBeLessThan(0.01);
    expect(
      Math.abs(totalAmount - expectedTotal),
      `Checkout total mismatch. Expected ${expectedTotal.toFixed(2)}, found ${totalAmount.toFixed(2)}`
    ).toBeLessThan(0.01);

    return {
      reportPrice,
      discountAmount,
      addOnAmount,
      totalAmount,
      expectedDiscount,
      expectedTotal,
      orderSummary: summaryText,
    };
  }

  getOptionalAddOnAmount(summaryText) {
    const match = summaryText.match(/(?:Add-on|Upsell)[\s\S]*?(?:[A-Z]{3}\s*)?([\d.,]+)\s+Coupon/i);
    return match ? this.parseAmount(match[1]) : 0;
  }

  getLabeledAmount(summaryText, pattern, label) {
    const match = summaryText.match(pattern);
    if (!match) {
      throw new Error(`${label} price was not found in the order summary: "${summaryText}".`);
    }
    return this.parseAmount(match[1]);
  }

  getDiscountedTotal(summaryText) {
    // Looks for 'Total' followed by optional currency and price.
    // Handles cases like 'Total $39.99 $33.99'
    const totalText = summaryText.match(/Total[\s\S]*?((?:[\$]?[\d.,]+(?:\s+[\$]?[\d.,]+)+))/i)?.[1];
    const amounts = totalText?.match(/[\d.,]+/g);
    if (!amounts || amounts.length < 1) {
      throw new Error(`Discounted total was not found in the order summary: "${summaryText}".`);
    }
    return this.parseAmount(amounts.at(-1));
  }

  parseAmount(amount) {
    return Number(amount.replace(/,/g, ''));
  }

  async applyAndVerifyCoupon(couponCode, couponPercentage) {
    await this.applyCoupon(couponCode, couponPercentage);
    return this.verifyCheckoutTotals(couponPercentage);
  }
}

module.exports = { CouponFlowHandler, CheckoutCouponFlowTest, CouponFlowVerifier };
