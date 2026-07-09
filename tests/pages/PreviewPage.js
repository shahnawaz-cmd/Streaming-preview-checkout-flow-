// tests/pages/PreviewPage.js
const TIMEOUT = process.env.CI ? 90000 : 30000;

class PreviewPage {
  constructor(page) {
    this.page = page;
    // Use .first() to resolve ambiguity if multiple buttons match
    this.accessRecordButton = page.locator('button:has-text("Access Record")').first();
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
    await this.page.waitForTimeout(1000);
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
}
module.exports = { PreviewPage };
