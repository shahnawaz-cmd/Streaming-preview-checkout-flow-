// tests/pages/PreviewPage.js
const TIMEOUT = process.env.CI ? 60000 : 30000;

class PreviewPage {
  constructor(page) {
    this.page = page;
    // Use .first() to resolve ambiguity if multiple buttons match
    this.accessRecordButton = page.locator('button:has-text("Access Record")').first();
  }

  async confirmSpecs() {
    // Add logic here
  }

  async verifySpecsVisible(expectedText = 'Records found for', timeout = TIMEOUT) {
    // Wait for the specific text to appear on the page
    await this.page.waitForSelector(`text=${expectedText}`, { timeout: timeout });
  }

  async verifyAccessRecordButton() {
    await this.accessRecordButton.waitFor({ state: 'visible', timeout: TIMEOUT });
    await this.accessRecordButton.isEnabled();
  }

  async clickAccessRecordButton() {
    await this.accessRecordButton.click();
    await this.page.waitForTimeout(1000);
  }
}
module.exports = { PreviewPage };
