const { chromium } = require('playwright');

(async () => {
  console.log('🔍 ANALYZING TRANSACTION HISTORY PAGE\n');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    await page.goto('https://brofit-native-swap-gacpxv158-will31s-projects.vercel.app/dashboard/history', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);

    console.log('\n📊 PAGE CONTENT ANALYSIS:\n');

    // Check for mock data indicator
    const txCards = await page.locator('.tx-card').count();
    console.log(`✓ Transaction Cards Found: ${txCards}`);

    // Get all transaction hashes
    const hashes = await page.locator('.tx-hash').allTextContents();
    console.log(`✓ Transaction Hashes: ${hashes.slice(0, 3).join(', ')}...`);

    // Check filter options
    const chainOptions = await page.locator('#chainFilter option').count();
    const typeOptions = await page.locator('#typeFilter option').count();
    const statusOptions = await page.locator('#statusFilter option').count();

    console.log(`✓ Chain Filter Options: ${chainOptions}`);
    console.log(`✓ Type Filter Options: ${typeOptions}`);
    console.log(`✓ Status Filter Options: ${statusOptions}`);

    // Check for pagination
    const paginationText = await page.locator('#pageInfo').textContent();
    console.log(`✓ Pagination: ${paginationText}`);

    // Check for export functionality
    const exportBtn = await page.locator('#exportBtn').isVisible();
    console.log(`✓ Export CSV Button: ${exportBtn ? 'Present' : 'Missing'}`);

    // Test search functionality
    console.log('\n🧪 TESTING FUNCTIONALITY:\n');

    // Test filter
    await page.selectOption('#typeFilter', 'swap');
    await page.waitForTimeout(500);
    const swapFiltered = await page.locator('.tx-card').count();
    console.log(`✓ Filter by 'Swap': ${swapFiltered} transactions shown`);

    await page.selectOption('#typeFilter', 'all');
    await page.waitForTimeout(500);

    // Test clicking a transaction
    await page.locator('.tx-card').first().click();
    await page.waitForTimeout(500);
    const modalVisible = await page.locator('#txModal').isVisible();
    console.log(`✓ Transaction Detail Modal: ${modalVisible ? 'Opens on click' : 'Not working'}`);

    // Close modal
    if (modalVisible) {
      await page.locator('#closeModal').click();
      await page.waitForTimeout(300);
    }

    // Screenshot
    console.log('\n📸 TAKING SCREENSHOTS:\n');
    await page.screenshot({
      path: 'screenshots/history-page-full.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: screenshots/history-page-full.png');

    // Open modal again for screenshot
    await page.locator('.tx-card').first().click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'screenshots/history-modal-detail.png',
      fullPage: true
    });
    console.log('✓ Modal screenshot saved: screenshots/history-modal-detail.png');

    console.log('\n' + '='.repeat(70));
    console.log('📋 ANALYSIS SUMMARY:\n');
    console.log('Data Source: MOCK/DUMMY (hardcoded in JavaScript)');
    console.log('Total Transactions: 5 (static mock data)');
    console.log('Real API Integration: NO');
    console.log('User Value: PROTOTYPE/DEMO ONLY');
    console.log('\nThis is a UI prototype showing what transaction history');
    console.log('WOULD look like. It does NOT display real blockchain data.');
    console.log('='.repeat(70));

    console.log('\n⏸️  Browser staying open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n👋 Analysis complete. Browser closed.');
  }
})();
