const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Inspecting BroFit Dashboard for styling issues...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    await page.goto('https://brofit-native-swap-78v5w6cmo-will31s-projects.vercel.app/', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);

    console.log('📊 Analyzing Dashboard Structure...\n');

    // Check Portfolio Card
    const portfolioCard = await page.locator('.card-portfolio').boundingBox();
    console.log('Portfolio Card:', portfolioCard);

    const portfolioCardHTML = await page.locator('.card-portfolio').innerHTML();
    console.log('\n📦 Portfolio Card HTML:');
    console.log(portfolioCardHTML.substring(0, 500) + '...');

    // Check Quick Actions Card
    const actionsCard = await page.locator('.card-actions').boundingBox();
    console.log('\nQuick Actions Card:', actionsCard);

    // Check Recent Activity Card
    const activityCard = await page.locator('.card-activity').boundingBox();
    console.log('\nRecent Activity Card:', activityCard);

    // Check Top Holdings Card
    const holdingsCard = await page.locator('.card-holdings').boundingBox();
    console.log('\nTop Holdings Card:', holdingsCard);

    // Get computed styles for portfolio card
    const portfolioStyles = await page.evaluate(() => {
      const card = document.querySelector('.card-portfolio');
      const computed = window.getComputedStyle(card);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        gap: computed.gap,
        padding: computed.padding,
        gridColumn: computed.gridColumn,
        gridRow: computed.gridRow
      };
    });
    console.log('\n🎨 Portfolio Card Computed Styles:', portfolioStyles);

    // Check dashboard grid
    const gridStyles = await page.evaluate(() => {
      const grid = document.querySelector('.dashboard-grid');
      const computed = window.getComputedStyle(grid);
      return {
        display: computed.display,
        gridTemplateColumns: computed.gridTemplateColumns,
        gap: computed.gap
      };
    });
    console.log('\n📐 Dashboard Grid Styles:', gridStyles);

    // Check all card titles
    const cardTitles = await page.evaluate(() => {
      const titles = document.querySelectorAll('.card-title');
      return Array.from(titles).map(t => ({
        text: t.textContent,
        innerHTML: t.innerHTML
      }));
    });
    console.log('\n📝 Card Titles:');
    cardTitles.forEach((title, i) => {
      console.log(`  ${i + 1}. "${title.text}"`);
      console.log(`     HTML: ${title.innerHTML}`);
    });

    // Check summary stats
    const summaryStats = await page.evaluate(() => {
      const stats = document.querySelector('.summary-stats');
      if (!stats) return null;
      const computed = window.getComputedStyle(stats);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        gap: computed.gap,
        exists: true
      };
    });
    console.log('\n📊 Summary Stats:', summaryStats);

    // Take detailed screenshots
    await page.screenshot({
      path: 'screenshots/inspect-full.png',
      fullPage: true
    });

    await page.locator('.card-portfolio').screenshot({
      path: 'screenshots/inspect-portfolio-card.png'
    });

    console.log('\n✅ Screenshots saved for analysis');
    console.log('\n⏸️  Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Inspection failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n👋 Inspection complete.');
  }
})();
