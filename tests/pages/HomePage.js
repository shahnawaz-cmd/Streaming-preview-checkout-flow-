// tests/pages/HomePage.js
class HomePage {
  constructor(page) {
    this.page = page;
    this.vinInput = page.locator('input[placeholder*="VIN"]');
    this.searchButton = page.locator('button:has-text("Search VIN")');
  }

  randomizeVin(baseVin, numToReplace = 1) {
    const randomDigits = Math.floor(Math.random() * Math.pow(10, numToReplace)).toString().padStart(numToReplace, '0');
    return baseVin.slice(0, -numToReplace) + randomDigits;
  }

  async navigate() {
    await this.page.goto('/');
  }

  async navigateWithOffer(offerCode) {
    await this.page.goto(`/?offer=${offerCode}`);
  }

  async decodeVin(vin, numToReplace = 1) {
    // Replace 'networkidle' with 'load' to be less restrictive
    await this.page.waitForLoadState('load');
    
    // Explicitly wait for the VIN input to be visible and ready
    await this.vinInput.waitFor({ state: 'visible' });
    
    const randomVin = this.randomizeVin(vin, numToReplace);
    await this.vinInput.fill(randomVin);
    await this.searchButton.click();
    return randomVin;
  }
  async verifyRevisitBannerVisible() {
    // Wait for load instead of networkidle
    await this.page.waitForLoadState('load');
    
    const banner = this.page.locator('text=Your report for');
    
    // Wait for the banner to be visible within a reasonable time.
    await banner.waitFor({ state: 'visible', timeout: 30000 });
    return banner;
  }

  async clickGrabItNow(banner) {
    const grabItNowButton = this.page.locator('button:has-text("Grab it now")').first();
    
    // Intelligent wait: ensure it is visible AND enabled before clicking
    await grabItNowButton.waitFor({ state: 'visible' });
    await grabItNowButton.waitFor({ state: 'attached' });
    
    await grabItNowButton.click();
  }
}
module.exports = { HomePage };
