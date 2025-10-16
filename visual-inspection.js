const { chromium } = require('playwright');

(async () => {
  console.log('🎨 Visual Inspection - CSS Styling Verification\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    await page.goto('https://brofit-native-swap-5ie9v8skb-will31s-projects.vercel.app/', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);

    console.log('📊 Checking CSS Variables and Computed Styles...\n');

    // Check if CSS variables are defined
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = getComputedStyle(root);
      return {
        accentPrimary: computed.getPropertyValue('--accent-primary').trim(),
        accentHover: computed.getPropertyValue('--accent-hover').trim(),
        surface0: computed.getPropertyValue('--surface-0').trim(),
        surface1: computed.getPropertyValue('--surface-1').trim(),
        borderPrimary: computed.getPropertyValue('--border-primary').trim(),
        textQuaternary: computed.getPropertyValue('--text-quaternary').trim()
      };
    });

    console.log('✅ CSS Variables Defined:');
    console.log('  --accent-primary:', cssVars.accentPrimary);
    console.log('  --accent-hover:', cssVars.accentHover);
    console.log('  --surface-0:', cssVars.surface0);
    console.log('  --surface-1:', cssVars.surface1);
    console.log('  --border-primary:', cssVars.borderPrimary);
    console.log('  --text-quaternary:', cssVars.textQuaternary);

    // Check summary-main gradient background
    const summaryMainStyles = await page.evaluate(() => {
      const el = document.querySelector('.summary-main');
      if (!el) return null;
      const computed = getComputedStyle(el);
      return {
        background: computed.background,
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
        padding: computed.padding,
        borderRadius: computed.borderRadius,
        display: computed.display
      };
    });

    console.log('\n🎨 Portfolio Summary Main Styles:');
    if (summaryMainStyles) {
      console.log('  Display:', summaryMainStyles.display);
      console.log('  Padding:', summaryMainStyles.padding);
      console.log('  Border Radius:', summaryMainStyles.borderRadius);
      console.log('  Background:', summaryMainStyles.backgroundImage);

      if (summaryMainStyles.backgroundImage.includes('gradient')) {
        console.log('  ✅ GRADIENT BACKGROUND IS RENDERING!');
      } else {
        console.log('  ❌ No gradient found');
      }
    } else {
      console.log('  ❌ .summary-main element not found');
    }

    // Check card styles
    const cardStyles = await page.evaluate(() => {
      const card = document.querySelector('.dashboard-card');
      if (!card) return null;
      const computed = getComputedStyle(card);
      return {
        background: computed.backgroundColor,
        border: computed.border,
        borderRadius: computed.borderRadius
      };
    });

    console.log('\n🎴 Dashboard Card Styles:');
    if (cardStyles) {
      console.log('  Background:', cardStyles.background);
      console.log('  Border:', cardStyles.border);
      console.log('  Border Radius:', cardStyles.borderRadius);
    }

    // Take detailed screenshot
    await page.screenshot({
      path: 'screenshots/visual-inspection-full.png',
      fullPage: true
    });
    console.log('\n📸 Full screenshot saved: screenshots/visual-inspection-full.png');

    // Screenshot portfolio card specifically
    const portfolioCard = page.locator('.card-portfolio');
    await portfolioCard.screenshot({
      path: 'screenshots/visual-inspection-portfolio-card.png'
    });
    console.log('📸 Portfolio card screenshot: screenshots/visual-inspection-portfolio-card.png');

    // Screenshot summary-main (gradient box)
    const summaryMain = page.locator('.summary-main');
    await summaryMain.screenshot({
      path: 'screenshots/visual-inspection-gradient-box.png'
    });
    console.log('📸 Gradient box screenshot: screenshots/visual-inspection-gradient-box.png');

    console.log('\n✅ Visual inspection complete!');
    console.log('⏸️  Browser staying open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Inspection failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n👋 Inspection complete.');
  }
})();
