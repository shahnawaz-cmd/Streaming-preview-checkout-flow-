// tests/pages/HomePage.js
const TIMEOUT = process.env.CI ? 60000 : 30000;

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
    await this.page.waitForLoadState('load');
    await this.vinInput.waitFor({ state: 'visible', timeout: TIMEOUT });
    
    const randomVin = this.randomizeVin(vin, numToReplace);
    await this.vinInput.fill(randomVin);
    await this.searchButton.click();
    return randomVin;
  }

  async verifyRevisitBannerVisible(bannerText = 'Your report for') {
    await this.page.waitForLoadState('load');
    const banner = this.page.locator(`text=${bannerText}`);
    await banner.waitFor({ state: 'visible', timeout: TIMEOUT });
    return banner;
  }

  async clickGrabItNow(banner) {
    const grabItNowButton = this.page.locator('button:has-text("Grab it now")').first();
    await grabItNowButton.waitFor({ state: 'visible', timeout: TIMEOUT });
    await grabItNowButton.waitFor({ state: 'attached', timeout: TIMEOUT });
    await grabItNowButton.click();
  }
}
module.exports = { HomePage };
