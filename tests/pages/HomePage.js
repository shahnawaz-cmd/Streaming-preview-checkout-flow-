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
    await this.page.goto('https://dvh.vehiclehistory.report/');
  }

  async decodeVin(vin, numToReplace = 1) {
    // Wait for the page to be fully loaded initially before filling
    await this.page.waitForLoadState('domcontentloaded');
    const randomVin = this.randomizeVin(vin, numToReplace);
    await this.vinInput.fill(randomVin);
    await this.searchButton.click();
    return randomVin;
  }
}
module.exports = { HomePage };
