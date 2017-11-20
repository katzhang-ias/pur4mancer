const puppeteer = require('puppeteer');
const utils = require('./utils');
let tmMetrics = {};

const numberOfRuns = process.argv[2] || 1;
const testPageUrl = process.argv[3] || 'http://www.hinckleytimes.net/news/local-news/your-surname-list-you-could-13736516?onScroll=off';

async function getFramePerformanceData(frame) {
    return await frame.evaluate(() => {
        const perfData = window.performance.timing;
        return perfData.loadEventEnd - perfData.navigationStart;
    })
};

async function traverseAllFrames(frame) {
    const totalLoadTime = await getFramePerformanceData(frame);
    console.log(frame.url(), totalLoadTime);
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
    browser = await puppeteer.launch({ headless: false }); // as of 0.11.0 of puppeteer timeout option doesn't work so have to catch the rejection exceeding default timeout
    page = await browser.newPage();
    await page.goto(testPageUrl);
    await page.waitFor(5*1000);
    // await traverseAllFrames(page.mainFrame());
    upsertSlotData(await page.evaluate(() => commercialData.performanceReport.components));
    await browser.close();
}

let proms = [];

for (let i = 0; i < numberOfRuns; ++i) {
    proms.push(trace());
}

Promise.all(proms).then(function() {
    for (let slot in tmMetrics) {
        for (let metric in tmMetrics[slot]) {
            let numbers = tmMetrics[slot][metric];
            tmMetrics[slot][metric].push(JSON.stringify({ mean: utils.getMean(numbers), sd: utils.getStandardDeviation(numbers) }));
        }
    }
    console.log(tmMetrics.divGptAdInArticleSlot.requestedToReceived);
}).catch(function(e) {
    console.log(e);
});
