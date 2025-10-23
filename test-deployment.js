/**
 * Playwright test to verify deployment is working correctly
 * Tests CSS loading, routing, and widget functionality
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app';

async function runTests() {
    console.log('🧪 Starting BroFit Deployment Tests...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;

    // Test 1: Homepage loads with CSS
    console.log('Test 1: Homepage loads with CSS...');
    try {
        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

        // Check for CSS by verifying computed styles
        const headerBg = await page.evaluate(() => {
            const header = document.querySelector('.dashboard-header');
            return window.getComputedStyle(header).backgroundColor;
        });

        if (headerBg && headerBg !== 'rgba(0, 0, 0, 0)') {
            console.log('✅ PASS: CSS loaded correctly\n');
            passed++;
        } else {
            console.log('❌ FAIL: CSS not loading (header has no background)\n');
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}\n`);
        failed++;
    }

    // Test 2: Dashboard route works
    console.log('Test 2: /dashboard route works...');
    try {
        const response = await page.goto(`${PRODUCTION_URL}/dashboard`, { waitUntil: 'networkidle' });

        if (response.status() === 200) {
            console.log('✅ PASS: /dashboard returns 200\n');
            passed++;
        } else {
            console.log(`❌ FAIL: /dashboard returned ${response.status()}\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}\n`);
        failed++;
    }

    // Test 3: Portfolio route works (the one that was 404ing)
    console.log('Test 3: /dashboard/portfolio route works...');
    try {
        const response = await page.goto(`${PRODUCTION_URL}/dashboard/portfolio`, { waitUntil: 'networkidle' });

        if (response.status() === 200) {
            console.log('✅ PASS: /dashboard/portfolio returns 200\n');
            passed++;
        } else {
            console.log(`❌ FAIL: /dashboard/portfolio returned ${response.status()}\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}\n`);
        failed++;
    }

    // Test 4: Verify navigation tabs exist and are styled
    console.log('Test 4: Navigation tabs render correctly...');
    try {
        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

        const navTabs = await page.$$('.nav-tab');
        const poolsTab = await page.$('.nav-tab-disabled');

        if (navTabs.length >= 5 && poolsTab) {
            console.log(`✅ PASS: Found ${navTabs.length} nav tabs including Pools tab\n`);
            passed++;
        } else {
            console.log(`❌ FAIL: Expected 6 tabs, found ${navTabs.length}\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}\n`);
        failed++;
    }

    // Test 5: Verify "soon" badge exists
    console.log('Test 5: Pools tab has "soon" badge...');
    try {
        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

        const soonBadge = await page.$('.soon-badge');
        const badgeText = await soonBadge?.textContent();

        if (badgeText === 'soon') {
            console.log('✅ PASS: "soon" badge found on Pools tab\n');
            passed++;
        } else {
            console.log(`❌ FAIL: Soon badge not found or wrong text: "${badgeText}"\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}\n`);
        failed++;
    }

    // Test 6: Verify footer is removed
    console.log('Test 6: Footer section removed...');
    try {
        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

        const footer = await page.$('.dashboard-footer');

        if (!footer) {
            console.log('✅ PASS: Footer successfully removed\n');
            passed++;
        } else {
            console.log('❌ FAIL: Footer still exists in DOM\n');
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}\n`);
        failed++;
    }

    // Test 7: CSS files are served correctly
    console.log('Test 7: CSS files return correct content-type...');
    try {
        const cssResponse = await page.goto(`${PRODUCTION_URL}/css/design-system.css`);
        const contentType = cssResponse.headers()['content-type'];

        if (contentType && contentType.includes('text/css')) {
            console.log('✅ PASS: CSS files served with correct content-type\n');
            passed++;
        } else {
            console.log(`❌ FAIL: CSS content-type is "${contentType}"\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}\n`);
        failed++;
    }

    // Test 8: Take screenshot for visual verification
    console.log('Test 8: Taking screenshot...');
    try {
        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'deployment-test-screenshot.png', fullPage: true });
        console.log('✅ PASS: Screenshot saved to deployment-test-screenshot.png\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}\n`);
        failed++;
    }

    await browser.close();

    // Summary
    console.log('='.repeat(50));
    console.log(`\n📊 Test Results: ${passed}/${passed + failed} passed\n`);

    if (failed === 0) {
        console.log('✅ All tests passed! Deployment is healthy.\n');
        process.exit(0);
    } else {
        console.log(`❌ ${failed} test(s) failed. Check output above.\n`);
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
