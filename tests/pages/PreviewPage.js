// tests/pages/PreviewPage.js
class PreviewPage {
  constructor(page) {
    this.page = page;
    // Use .first() to resolve ambiguity if multiple buttons match
    this.accessRecordButton = page.locator('button:has-text("Access Record")').first();
  }

  async confirmSpecs() {
    // Add logic here
  }

  async verifySpecsVisible() {
    // Wait for the text 'Records found for' to appear on the page
    await this.page.waitForSelector('text=Records found for');
  }

  async verifyAccessRecordButton() {
    await this.accessRecordButton.waitFor({ state: 'visible' });
    await this.accessRecordButton.isEnabled();
  }

  async clickAccessRecordButton() {
    await this.accessRecordButton.click();
    await this.page.waitForTimeout(1000);
  }
}
module.exports = { PreviewPage };
