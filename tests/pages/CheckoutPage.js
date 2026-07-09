// tests/pages/CheckoutPage.js
const TIMEOUT = process.env.CI ? 90000 : 30000;

class CheckoutPage {
  constructor(page) {
    this.page = page;
  }

  async applyCoupon(coupon) {
    const couponInput = this.page.locator('input[placeholder*="Coupon" i]');
    await couponInput.waitFor({ state: 'visible', timeout: TIMEOUT });
    await couponInput.fill(coupon);
    await this.page.getByRole('button', { name: /Apply/i }).click();
  }

  async payWithStripe(cardData) {
    // Logic for Stripe payment
  }

  async payWithPayPal() {
    // Logic for PayPal payment
  }

  async payWithPaystack() {
    // Logic for Paystack payment
  }
}
module.exports = { CheckoutPage };
