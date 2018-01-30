const puppeteer = require('puppeteer');
let browser, page;

const TEST_PAGE = 'http://st.adsafecontrol.com/test/?tagtype=jload&tagtypeinput=&embedding=direct&thirdpartypixeltype=none&start=inView&obstruction=hide&load=static&percentinview=100&fwserver=fw-moira.303net.net&adformat=image&adwrapper=false&taglength=0&tagprotocol=http&passthroughmacros=false&clientapi=none&containerstyle=none&pixelplacement=after';


(async () => {
    browser = await puppeteer.launch({headless: false}); // as of 0.11.0 of puppeteer timeout option doesn't work so have to catch the rejection exceeding default timeout
    page = await browser.newPage();
    page.goto(TEST_PAGE);
    page.on('request', (r) => {
        console.log('request: ', r.url());
    });
    await page.waitFor(5*1000);
    await browser.close();
    console.log('close browser after 5 seconds.');
})().catch(async e => {
    await page.tracing.stop();
    await browser.close();
    console.log('error', e.message);
});