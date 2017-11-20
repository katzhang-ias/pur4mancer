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
    // const loadTime = await frameContext.evaluate(() => {
    //     const perfData = window.performance.timing;
    //     return perfData.loadEventEnd - perfData.navigationStart;
    // });
    let loadTime;
    await frameContext.evaluate(async () => {
        new Promise((resolve, reject) => {
            try {
                const perfData = window.performance.timing;
                page.mainFrame().console.log('perfData.loadEventEnd', perfData.loadEventEnd);
                console.log('perfData.navigationStart', perfData.navigationStart);
                if (perfData.loadEventEnd && perfData.navigationStart && perfData.loadEventEnd - perfData.navigationStart > 0) {
                    resolve(perfData.loadEventEnd - perfData.navigationStart);
                }
            } catch (e) { reject(e); };
        })
        .then(diff => loadTime = diff)
        .catch(e => console.error(e));
    });
    console.log(frame.url(), loadTime);
};

async function traverseAllFrames(frame) {
    const totalLoadTime = await getFramePerformanceData(frame);
    for (let child of frame.childFrames()) {
        traverseAllFrames(child);
    }
}

function upsertSlotData(componentsData) {
    for (let slot in componentsData) {
        for (let metric in componentsData[slot].data) {
            if (!tmMetrics[slot]) tmMetrics[slot] = {};
            if (!tmMetrics[slot][metric]) tmMetrics[slot][metric] = [];
            tmMetrics[slot][metric].push(componentsData[slot].data[metric]);
        }
    }
}

async function trace() {
    let browser, page;
    browser = await puppeteer.launch({
        args: ['--shm-size=10gb'],
        headless: false
    }); // as of 0.11.0 of puppeteer timeout option doesn't work so have to catch the rejection exceeding default timeout
    page = await browser.newPage();
    await page.goto(testPageUrl);
    await page.waitFor(5*1000);
    await traverseAllFrames(page.mainFrame());
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