import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('--- Testing Homepage Network Requests ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const requests = [];
  const errors = [];
  let requestCount = 0;

  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[PAGE ERROR]:', err.message);
  });

  page.on('request', req => {
    requestCount++;
    if (requestCount <= 20 || requestCount % 10 === 0) {
      console.log(`[REQ #${requestCount}] ${req.method()} ${req.url()}`);
    }
  });

  page.on('requestfailed', req => {
    const failure = req.failure();
    console.error(`[REQ FAILED] ${req.method()} ${req.url()} - ${failure?.errorText}`);
    errors.push({ url: req.url(), error: failure?.errorText });
  });

  page.on('response', res => {
    if (res.url().includes('/api/v1/')) {
      console.log(`[RES ${res.status()}] ${res.url()}`);
    }
  });

  try {
    console.log('Navigating to http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait 5 seconds to observe if there is a request loop
    console.log('Observing network for 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));

    console.log(`Total requests triggered: ${requestCount}`);
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body preview:\n', bodyText.substring(0, 400));
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await browser.close();
  }
}

run();
