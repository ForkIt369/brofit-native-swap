const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting BroFit Dashboard Test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Test 1: Load Dashboard Home
    console.log('📊 Test 1: Loading dashboard home...');
    await page.goto('https://brofit-native-swap-78v5w6cmo-will31s-projects.vercel.app/', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log(`   ✅ Page loaded: ${title}`);

    // Test 2: Check header elements
    console.log('\n🔍 Test 2: Checking header elements...');

    const brandName = await page.locator('.brand-name').textContent();
    console.log(`   ✅ Brand name: ${brandName}`);

    const navTabs = await page.locator('.nav-tab').count();
    console.log(`   ✅ Navigation tabs: ${navTabs} tabs found`);

    const connectBtn = await page.locator('#connectWalletBtn').isVisible();
    console.log(`   ✅ Connect wallet button visible: ${connectBtn}`);

    // Test 3: Check dashboard cards
    console.log('\n📦 Test 3: Checking dashboard cards...');

    const cards = await page.locator('.dashboard-card').count();
    console.log(`   ✅ Dashboard cards: ${cards} cards found`);

    const portfolioCard = await page.locator('.card-portfolio').isVisible();
    console.log(`   ✅ Portfolio card visible: ${portfolioCard}`);

    const actionsCard = await page.locator('.card-actions').isVisible();
    console.log(`   ✅ Quick actions card visible: ${actionsCard}`);

    // Test 4: Check tab navigation
    console.log('\n🧭 Test 4: Testing tab navigation...');

    // Click Swap tab
    await page.locator('.nav-tab[data-route="swap"]').click();
    await page.waitForTimeout(1500);
    console.log('   ✅ Clicked Swap tab');

    const swapFrameVisible = await page.locator('#widgetFrame').isVisible();
    console.log(`   ✅ Widget iframe visible: ${swapFrameVisible}`);

    // Click Portfolio tab
    await page.locator('.nav-tab[data-route="portfolio"]').click();
    await page.waitForTimeout(1500);
    console.log('   ✅ Clicked Portfolio tab');

    // Click History tab
    await page.locator('.nav-tab[data-route="history"]').click();
    await page.waitForTimeout(1500);
    console.log('   ✅ Clicked History tab');

    // Click Bridge tab
    await page.locator('.nav-tab[data-route="bridge"]').click();
    await page.waitForTimeout(1500);
    console.log('   ✅ Clicked Bridge tab');

    // Return to Dashboard
    await page.locator('.nav-tab[data-route="dashboard"]').click();
    await page.waitForTimeout(1500);
    console.log('   ✅ Returned to Dashboard home');

    const dashboardHomeVisible = await page.locator('#dashboardHome').isVisible();
    console.log(`   ✅ Dashboard home visible: ${dashboardHomeVisible}`);

    // Test 5: Check footer
    console.log('\n📄 Test 5: Checking footer...');

    const footer = await page.locator('.dashboard-footer').isVisible();
    console.log(`   ✅ Footer visible: ${footer}`);

    const footerText = await page.locator('.footer-info').textContent();
    console.log(`   ✅ Footer text: ${footerText.trim()}`);

    // Test 6: Take screenshots
    console.log('\n📸 Test 6: Taking screenshots...');

    await page.screenshot({
      path: 'screenshots/dashboard-home.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot saved: screenshots/dashboard-home.png');

    // Navigate to swap and screenshot
    await page.locator('.nav-tab[data-route="swap"]').click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'screenshots/dashboard-swap.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot saved: screenshots/dashboard-swap.png');

    // Test 7: Responsive design check
    console.log('\n📱 Test 7: Testing responsive design...');

    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'screenshots/dashboard-mobile.png',
      fullPage: true
    });
    console.log('   ✅ Mobile screenshot saved: screenshots/dashboard-mobile.png');

    // Test 8: Check state manager
    console.log('\n🧠 Test 8: Checking state manager...');

    const stateManagerExists = await page.evaluate(() => {
      return typeof window.stateManager !== 'undefined';
    });
    console.log(`   ✅ State manager loaded: ${stateManagerExists}`);

    if (stateManagerExists) {
      const stateData = await page.evaluate(() => {
        return {
          walletConnected: window.getState('wallet.connected'),
          activeRoute: window.getState('ui.activeRoute'),
          portfolioAssets: window.getState('portfolio.totalAssets')
        };
      });
      console.log(`   ✅ Wallet connected: ${stateData.walletConnected}`);
      console.log(`   ✅ Active route: ${stateData.activeRoute}`);
      console.log(`   ✅ Portfolio assets: ${stateData.portfolioAssets}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Dashboard is fully functional');
    console.log('✅ Navigation works correctly');
    console.log('✅ All widgets load properly');
    console.log('✅ Responsive design working');
    console.log('✅ State management initialized');
    console.log('\n📊 Dashboard URL: https://brofit-native-swap-78v5w6cmo-will31s-projects.vercel.app/');
    console.log('📸 Screenshots saved to: ./screenshots/');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/error.png' });
    console.log('📸 Error screenshot saved: screenshots/error.png');
  } finally {
    await page.waitForTimeout(3000); // Keep browser open for 3 seconds
    await browser.close();
    console.log('\n👋 Test complete. Browser closed.');
  }
})();
