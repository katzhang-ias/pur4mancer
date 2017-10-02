const puppeteer = require('puppeteer');
let browser, page;

(async () => {
    browser = await puppeteer.launch({headless: false}); // as of 0.11.0 of puppeteer timeout option doesn't work so have to catch the rejection exceeding default timeout
    page = await browser.newPage();
    await page.tracing.start({path: 'carsales.json', screenshots: true});
    await page.goto('https://www.motoring.com.au/?mike=pg');
    await page.tracing.stop();
    await browser.close();
})().catch(async e => {
    await page.tracing.stop();
    await browser.close();
    console.log('error', e.message);
});