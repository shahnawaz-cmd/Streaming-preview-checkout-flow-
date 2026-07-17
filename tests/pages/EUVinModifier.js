// tests/pages/EUVinModifier.js
const { EUVinCapture } = require('../helpers/responseCapture');

class EUVinModifier {
  constructor(page) {
    this.page = page;
  }

  async modifyEUVinByYMMUsingNo() {
    await this.page.getByRole('button', { name: 'No, fix it' }).click();
    await this.page.waitForTimeout(13000);
    await this.page.getByRole('textbox', { name: 'Select year' }).click();
    await this.page.getByRole('button', { name: '2012' }).click();
    await this.page.getByRole('textbox', { name: 'Select make' }).click();
    await this.page.getByRole('button', { name: 'Alfa Romeo' }).click();
    await this.page.getByRole('textbox', { name: 'Select model' }).click();
    await this.page.getByRole('button', { name: 'Giulietta II' }).click();
    await this.page.getByRole('textbox', { name: 'Select trim' }).click();
    await this.page.getByRole('button', { name: '1.4 GLP Turbo 120HP' }).click();

    const vinCapture = new EUVinCapture(this.page);
    
    // Trigger the action and wait for the response in parallel
    await Promise.all([
      vinCapture.waitForVinCheckPreview(),
      this.page.getByRole('button', { name: 'Get Records' }).click()
    ]);
    
    await this.page.waitForTimeout(4000);
  }
}

module.exports = { EUVinModifier };
