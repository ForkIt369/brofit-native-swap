const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Opening history page...');
    await page.goto('https://brofit-native-swap-gacpxv158-will31s-projects.vercel.app/dashboard/history', {
      waitUntil: 'networkidle'
    });

    console.log('Waiting 5 seconds for JavaScript to load...');
    await page.waitForTimeout(5000);

    console.log('Taking screenshot...');
    await page.screenshot({
      path: 'screenshots/history-check.png',
      fullPage: true
    });

    console.log('Checking console errors...');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    console.log('\nPage Title:', await page.title());
    console.log('Screenshot saved: screenshots/history-check.png');

    console.log('\nBrowser staying open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
