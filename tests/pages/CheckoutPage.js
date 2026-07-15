// tests/pages/CheckoutPage.js
const TIMEOUT = process.env.CI ? 90000 : 30000;

class CheckoutPage {
  static TestCards = {
    visa_us: { 
      number: '4242424242424242', 
      expiry: '12/26', 
      cvc: '123', 
      zip: '10001', 
      country: 'United States',
      countryCode: 'US'
    },
    mastercard_pk: { 
      number: '5555555555555555', 
      expiry: '12/26', 
      cvc: '123', 
      zip: '', 
      country: 'Pakistan',
      countryCode: 'PK'
    },
    generic_decline: {
      number: '4000000000000002',
      expiry: '12/26',
      cvc: '123',
      zip: '10001',
      country: 'United States',
      countryCode: 'US'
    }
  };

  constructor(page) {
    this.page = page;
  }

  async applyCoupon(coupon) {
    const couponInput = this.page.locator('input[placeholder*="Coupon" i]');
    await couponInput.waitFor({ state: 'visible', timeout: TIMEOUT });
    await couponInput.fill(coupon);
    await this.page.getByRole('button', { name: /Apply/i }).click();
  }

  async completeCheckoutProcess(cardKey = 'visa_us') {
    const cardData = CheckoutPage.TestCards[cardKey] || CheckoutPage.TestCards.visa_us;
    await this.payWithStripe(cardData);
  }

  async payWithStripe(cardData) {
    // Click Card payment option first
    await this.page.getByRole('button', { name: 'Card' }).click();

    // Use the first matching frame, as multiple frames may have the same title
    const frame = this.page.frameLocator('iframe[title="Secure payment input frame"]').first();

    await frame.getByRole('textbox', { name: 'Card number' }).fill(cardData.number);
    await frame.getByRole('textbox', { name: 'Expiration date MM / YY' }).fill(cardData.expiry);
    await frame.getByRole('textbox', { name: 'Security code' }).fill(cardData.cvc);

    // Select Country
    if (cardData.countryCode) {
        await frame.getByLabel('Country').selectOption(cardData.countryCode);
    }

    // Conditional ZIP code handling: check if field exists before filling
    const zipField = frame.getByRole('textbox', { name: 'ZIP code' });
    if (await zipField.isVisible()) {
      await zipField.fill(cardData.zip || '12345');
    }

    // Click the dynamic submit button ("Pay NGN", "Pay USD", etc.) and skip the provider tabs.
    await this.page.getByRole('button', { name: /^Pay\b/i }).click();
  }

  async payWithPayPal() {
    // Logic for PayPal payment
  }

  async payWithPaystack() {
    // Logic for Paystack payment
  }
}
module.exports = { CheckoutPage };
