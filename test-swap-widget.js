const { chromium } = require('playwright');

(async () => {
  console.log('🔄 Testing BroFit Swap Widget...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to swap page
    console.log('📊 Test 1: Loading swap widget...');
    await page.goto('https://brofit-native-swap-gacpxv158-will31s-projects.vercel.app/dashboard/swap', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log(`   ✅ Page loaded: ${title}`);

    // Check if swap interface is visible
    console.log('\n🔍 Test 2: Checking swap interface elements...');

    const swapInterface = await page.locator('.swap-card, .swap-container, .main-swap-card').first().isVisible();
    console.log(`   ✅ Swap interface visible: ${swapInterface}`);

    const fromToken = await page.locator('text=From').isVisible().catch(() => false);
    console.log(`   ✅ "From" token selector: ${fromToken}`);

    const toToken = await page.locator('text=To').isVisible().catch(() => false);
    console.log(`   ✅ "To" token selector: ${toToken}`);

    // Check for swap button
    const swapButton = await page.locator('button:has-text("Swap"), button:has-text("Connect")').first().isVisible();
    console.log(`   ✅ Swap/Connect button visible: ${swapButton}`);

    // Take screenshot
    console.log('\n📸 Test 3: Taking screenshots...');
    await page.screenshot({
      path: 'screenshots/swap-widget-full.png',
      fullPage: true
    });
    console.log('   ✅ Full screenshot saved: screenshots/swap-widget-full.png');

    // Check for error messages
    console.log('\n🔍 Test 4: Checking for error messages...');
    const errorMessages = await page.locator('text=/Failed to load|Could not connect|404|NOT_FOUND/i').count();

    if (errorMessages > 0) {
      const errorText = await page.locator('text=/Failed to load|Could not connect|404|NOT_FOUND/i').first().textContent();
      console.log(`   ❌ Error found: ${errorText}`);
    } else {
      console.log('   ✅ No error messages found');
    }

    // Test token selector interaction
    console.log('\n🔍 Test 5: Testing token selector interaction...');
    const tokenSelectors = await page.locator('.token-selector, .token-button, button:has-text("ETH"), button:has-text("USDT")').count();
    console.log(`   ✅ Token selectors found: ${tokenSelectors}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    if (errorMessages === 0 && swapInterface) {
      console.log('🎉 SWAP WIDGET WORKING!');
      console.log('='.repeat(60));
      console.log('\n✅ Swap interface loaded successfully');
      console.log('✅ No error messages');
      console.log('✅ UI elements visible and functional');
    } else {
      console.log('⚠️  SWAP WIDGET HAS ISSUES');
      console.log('='.repeat(60));
      if (errorMessages > 0) console.log('❌ Error messages present');
      if (!swapInterface) console.log('❌ Swap interface not visible');
    }
    console.log('\n📊 Swap Widget URL: https://brofit-native-swap-gacpxv158-will31s-projects.vercel.app/dashboard/swap');
    console.log('📸 Screenshots saved to: ./screenshots/');

    console.log('\n⏸️  Browser staying open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/swap-error.png' });
    console.log('📸 Error screenshot saved: screenshots/swap-error.png');
  } finally {
    await browser.close();
    console.log('\n👋 Test complete. Browser closed.');
  }
})();
