const puppeteer = require('puppeteer');
const utils = require('./utils');
let tmMetrics = {};

const JLOAD_SHALLOW_XODMAIN = 'http://st.adsafecontrol.com/test/?tagtype=jload&tagtypeinput=&embedding=crossDomain&thirdpartypixeltype=none&start=inView&obstruction=hide&load=static&percentinview=100&fwserver=fw-moira.303net.net&adformat=image&adwrapper=false&taglength=0&tagprotocol=http&dynamicmacros=false&clientapi=none&containerstyle=none&pixelplacement=after&iframesize=normal&doctype=none&tagembedlocation=body&iframenestingdepth=shallow';
const JLOAD_SHALLOW_FRIENDLY = 'http://st.adsafecontrol.com/test/?tagtype=jload&tagtypeinput=&embedding=nested&thirdpartypixeltype=none&start=inView&obstruction=hide&load=static&percentinview=100&fwserver=fw-moira.303net.net&adformat=image&adwrapper=false&taglength=0&tagprotocol=http&dynamicmacros=false&clientapi=none&containerstyle=none&pixelplacement=after&iframesize=normal&doctype=none&tagembedlocation=body&iframenestingdepth=shallow';
const JLOAD_DEEP_XDOMAIN = 'http://st.adsafecontrol.com/test/?tagtype=jload&tagtypeinput=&embedding=crossDomain&thirdpartypixeltype=none&start=inView&obstruction=hide&load=static&percentinview=100&fwserver=fw-moira.303net.net&adformat=image&adwrapper=false&taglength=0&tagprotocol=http&dynamicmacros=false&clientapi=none&containerstyle=none&pixelplacement=after&iframesize=normal&doctype=none&tagembedlocation=body&iframenestingdepth=deep';

const numberOfRuns = process.argv[2] || 1;
const testPageUrl = process.argv[3] || JLOAD_DEEP_XDOMAIN;

async function getFramePerformanceData(frame) {
    const frameContext = frame.executionContext();
    const loadTime = await frameContext.evaluate(() => {
        const perfData = window.performance.timing;
        return perfData.loadEventEnd - perfData.navigationStart;
    });
    console.log(frame.url(), loadTime);
    return Promise.resolve(loadTime);
};

async function traverseAllFrames(frame, indent) {
    // const totalLoadTime = getFramePerformanceData(frame);
    // const loadTime = await frame.evaluate(() => {
    //     const perfData = window.performance.timing;
    // });
    // console.log(indent + frame.url());
    // console.log(`${indent}${frame.url()}: 'load time:' ${totalLoadTime}`);
    for (let child of frame.childFrames()) {
        await child.evaluate(() => {
            const perf = window.performance.timing;
            console.log(child.url(), perf.loadEventEnd - perf.navigationStart);
            return Promise.resolve();
        });
        traverseAllFrames(child, indent + ' ');
        return Promise.resolve();
    }
}

async function trace() {
    let browser, page;
    browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: false
    });
    page = await browser.newPage();
    await page.goto(testPageUrl);
    await page.waitFor(5*1000);
    traverseAllFrames(page.mainFrame(), '');
    await browser.close();
}

let proms = [];

for (let i = 0; i < numberOfRuns; ++i) {
    proms.push(trace());
}

Promise.all(proms).then(function() {
    console.log('Done!');
}).catch(function(e) {
    console.log(e);
});