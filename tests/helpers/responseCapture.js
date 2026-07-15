class ApiResponseCapture {
  constructor(page, timeout = 60000) {
    this.page = page;
    this.timeout = timeout;
    this.stripeResponses = [];
    this.paymentUpdateResponses = [];
  }

  async captureResponse(response) {
    const record = {
      url: response.url(),
      status: response.status(),
      ok: response.ok(),
    };

    try {
      const text = await response.text();
      record.body = text;

      try {
        record.json = JSON.parse(text);
      } catch (parseError) {
        record.parseError = parseError.message;
      }
    } catch (error) {
      record.error = error.message;
    }

    return record;
  }

  async waitForStripePaymentIntent() {
    const response = await this.page.waitForResponse(
      (response) => response.url().includes('https://api.stripe.com/v1/payment_intents'),
      { timeout: this.timeout }
    );
    const record = await this.captureResponse(response);
    this.stripeResponses.push(record);
    return record;
  }

  async waitForPaymentUpdate() {
    const response = await this.page.waitForResponse(
      (response) => response.url().includes('/api-cwa/payment-update') && response.ok(),
      { timeout: this.timeout }
    );
    const record = await this.captureResponse(response);
    this.paymentUpdateResponses.push(record);
    return record;
  }
}

module.exports = { ApiResponseCapture };
