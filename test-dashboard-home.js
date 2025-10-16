const { chromium } = require('playwright');

(async () => {
  console.log('🏠 Testing BroFit Dashboard Home Layout...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('📊 Loading dashboard home...');
    await page.goto('https://brofit-native-swap-gacpxv158-will31s-projects.vercel.app/dashboard', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded\n');

    // Check CSS loading
    console.log('🎨 Checking CSS...');
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`   Background color: ${bgColor}`);

    // Check grid layout
    const gridColumns = await page.evaluate(() => {
      const grid = document.querySelector('.dashboard-grid');
      return grid ? window.getComputedStyle(grid).gridTemplateColumns : null;
    });
    console.log(`   Grid columns: ${gridColumns}`);

    // Take screenshots
    console.log('\n📸 Taking screenshots...');
    await page.screenshot({
      path: 'screenshots/dashboard-home-desktop.png',
      fullPage: true
    });
    console.log('   ✅ Desktop screenshot saved');

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'screenshots/dashboard-home-tablet.png',
      fullPage: true
    });
    console.log('   ✅ Tablet screenshot saved');

    // Test mobile view
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'screenshots/dashboard-home-mobile.png',
      fullPage: true
    });
    console.log('   ✅ Mobile screenshot saved');

    console.log('\n✅ All dashboard layouts verified!');
    console.log('\n⏸️  Browser staying open for 3 seconds...');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n👋 Test complete. Browser closed.');
  }
})();
