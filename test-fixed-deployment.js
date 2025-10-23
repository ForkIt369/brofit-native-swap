/**
 * Test the fixed deployment
 * Verifies CSS loading and widget routing both work correctly
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://brofit-native-swap-2x5r73frq-will31s-projects.vercel.app';

async function testFixedDeployment() {
    console.log('🧪 TESTING FIXED DEPLOYMENT\n');
    console.log('='.repeat(70));
    console.log(`URL: ${PRODUCTION_URL}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });

    let passed = 0;
    let failed = 0;
    const issues = [];

    // Test 1: Dashboard home - CSS loading
    console.log('\n✅ Test 1: Dashboard Home - CSS Loading');
    console.log('-'.repeat(70));
    try {
        const page = await context.newPage();
        await page.goto(`${PRODUCTION_URL}/dashboard`, { waitUntil: 'networkidle' });

        // Check CSS loaded
        const headerBg = await page.evaluate(() => {
            const header = document.querySelector('.dashboard-header');
            return window.getComputedStyle(header).backgroundColor;
        });

        if (headerBg && headerBg !== 'rgba(0, 0, 0, 0)') {
            console.log(`  ✅ CSS loaded: ${headerBg}`);
            passed++;
        } else {
            console.log('  ❌ CSS not loading');
            issues.push('Dashboard CSS not loading');
            failed++;
        }

        // Check for console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.waitForTimeout(2000);

        if (consoleErrors.length === 0) {
            console.log('  ✅ No console errors');
            passed++;
        } else {
            console.log(`  ❌ ${consoleErrors.length} console errors found`);
            consoleErrors.slice(0, 3).forEach(err => console.log(`    - ${err}`));
            issues.push(`${consoleErrors.length} console errors on dashboard`);
            failed++;
        }

        await page.close();
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        issues.push(`Dashboard test error: ${error.message}`);
        failed++;
    }

    // Test 2: Swap widget - CSS loading and widget iframe
    console.log('\n✅ Test 2: Swap Widget - CSS & Iframe');
    console.log('-'.repeat(70));
    try {
        const page = await context.newPage();
        await page.goto(`${PRODUCTION_URL}/dashboard/swap`, { waitUntil: 'networkidle', timeout: 15000 });

        // Check CSS loaded
        const headerBg = await page.evaluate(() => {
            const header = document.querySelector('.dashboard-header');
            return window.getComputedStyle(header).backgroundColor;
        });

        if (headerBg && headerBg !== 'rgba(0, 0, 0, 0)') {
            console.log(`  ✅ CSS loaded on /swap route`);
            passed++;
        } else {
            console.log('  ❌ CSS not loading on /swap route');
            issues.push('Swap route CSS not loading');
            failed++;
        }

        // Wait for widget iframe to load
        await page.waitForTimeout(3000);

        // Check if widget iframe is visible
        const widgetFrame = await page.$('#widgetFrame');
        const isVisible = await page.evaluate(() => {
            const frame = document.getElementById('widgetFrame');
            return frame && frame.style.display !== 'none';
        });

        if (isVisible) {
            console.log('  ✅ Widget iframe visible');
            passed++;

            // Check if dashboard home is hidden
            const dashboardHidden = await page.evaluate(() => {
                const home = document.getElementById('dashboardHome');
                return home && home.style.display === 'none';
            });

            if (dashboardHidden) {
                console.log('  ✅ Dashboard home hidden (showing widget)');
                passed++;
            } else {
                console.log('  ❌ Dashboard home still visible (should show widget)');
                issues.push('Dashboard home not hidden on swap route');
                failed++;
            }
        } else {
            console.log('  ❌ Widget iframe not visible');
            issues.push('Swap widget iframe not showing');
            failed++;
        }

        await page.screenshot({ path: 'screenshots/test-swap-fixed.png', fullPage: true });
        console.log('  📸 Screenshot: screenshots/test-swap-fixed.png');

        await page.close();
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        issues.push(`Swap widget test error: ${error.message}`);
        failed++;
    }

    // Test 3: Bridge widget
    console.log('\n✅ Test 3: Bridge Widget');
    console.log('-'.repeat(70));
    try {
        const page = await context.newPage();
        await page.goto(`${PRODUCTION_URL}/dashboard/bridge`, { waitUntil: 'networkidle', timeout: 15000 });

        // Check CSS loaded
        const headerBg = await page.evaluate(() => {
            const header = document.querySelector('.dashboard-header');
            return window.getComputedStyle(header).backgroundColor;
        });

        if (headerBg && headerBg !== 'rgba(0, 0, 0, 0)') {
            console.log(`  ✅ CSS loaded on /bridge route`);
            passed++;
        } else {
            console.log('  ❌ CSS not loading on /bridge route');
            issues.push('Bridge route CSS not loading');
            failed++;
        }

        await page.waitForTimeout(3000);

        const isVisible = await page.evaluate(() => {
            const frame = document.getElementById('widgetFrame');
            return frame && frame.style.display !== 'none';
        });

        if (isVisible) {
            console.log('  ✅ Widget iframe visible');
            passed++;
        } else {
            console.log('  ❌ Widget iframe not visible');
            issues.push('Bridge widget iframe not showing');
            failed++;
        }

        await page.close();
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        issues.push(`Bridge widget test error: ${error.message}`);
        failed++;
    }

    // Test 4: Portfolio widget
    console.log('\n✅ Test 4: Portfolio Widget');
    console.log('-'.repeat(70));
    try {
        const page = await context.newPage();
        await page.goto(`${PRODUCTION_URL}/dashboard/portfolio`, { waitUntil: 'networkidle', timeout: 15000 });

        // Check CSS loaded
        const headerBg = await page.evaluate(() => {
            const header = document.querySelector('.dashboard-header');
            return window.getComputedStyle(header).backgroundColor;
        });

        if (headerBg && headerBg !== 'rgba(0, 0, 0, 0)') {
            console.log(`  ✅ CSS loaded on /portfolio route`);
            passed++;
        } else {
            console.log('  ❌ CSS not loading on /portfolio route');
            issues.push('Portfolio route CSS not loading');
            failed++;
        }

        await page.waitForTimeout(3000);

        const isVisible = await page.evaluate(() => {
            const frame = document.getElementById('widgetFrame');
            return frame && frame.style.display !== 'none';
        });

        if (isVisible) {
            console.log('  ✅ Widget iframe visible');
            passed++;
        } else {
            console.log('  ❌ Widget iframe not visible');
            issues.push('Portfolio widget iframe not showing');
            failed++;
        }

        await page.close();
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        issues.push(`Portfolio widget test error: ${error.message}`);
        failed++;
    }

    // Test 5: History widget
    console.log('\n✅ Test 5: History Widget');
    console.log('-'.repeat(70));
    try {
        const page = await context.newPage();
        await page.goto(`${PRODUCTION_URL}/dashboard/history`, { waitUntil: 'networkidle', timeout: 15000 });

        // Check CSS loaded
        const headerBg = await page.evaluate(() => {
            const header = document.querySelector('.dashboard-header');
            return window.getComputedStyle(header).backgroundColor;
        });

        if (headerBg && headerBg !== 'rgba(0, 0, 0, 0)') {
            console.log(`  ✅ CSS loaded on /history route`);
            passed++;
        } else {
            console.log('  ❌ CSS not loading on /history route');
            issues.push('History route CSS not loading');
            failed++;
        }

        await page.waitForTimeout(3000);

        const isVisible = await page.evaluate(() => {
            const frame = document.getElementById('widgetFrame');
            return frame && frame.style.display !== 'none';
        });

        if (isVisible) {
            console.log('  ✅ Widget iframe visible');
            passed++;
        } else {
            console.log('  ❌ Widget iframe not visible');
            issues.push('History widget iframe not showing');
            failed++;
        }

        await page.close();
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        issues.push(`History widget test error: ${error.message}`);
        failed++;
    }

    await browser.close();

    // Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 FINAL REPORT');
    console.log('='.repeat(70));
    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (issues.length > 0) {
        console.log('\n⚠️  Issues Found:');
        issues.forEach((issue, i) => {
            console.log(`  ${i + 1}. ${issue}`);
        });
    } else {
        console.log('\n🎉 ALL ISSUES FIXED! Deployment is perfect!');
    }

    console.log('\n' + '='.repeat(70));

    process.exit(failed === 0 ? 0 : 1);
}

testFixedDeployment().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
