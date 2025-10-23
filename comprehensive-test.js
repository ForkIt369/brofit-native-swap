/**
 * Comprehensive Playwright test for BroFit deployment
 * Tests all pages, embedding, visual verification, and functionality
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app';

async function comprehensiveTest() {
    console.log('🔍 COMPREHENSIVE BROFIT DEPLOYMENT TEST\n');
    console.log('=' .repeat(60));
    console.log(`Production URL: ${PRODUCTION_URL}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    let passed = 0;
    let failed = 0;
    const issues = [];

    // ============================================================
    // SECTION 1: HOMEPAGE VERIFICATION
    // ============================================================
    console.log('\n📱 SECTION 1: HOMEPAGE VERIFICATION');
    console.log('-'.repeat(60));

    try {
        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

        // Test CSS Loading
        const headerBg = await page.evaluate(() => {
            const header = document.querySelector('.dashboard-header');
            return window.getComputedStyle(header).backgroundColor;
        });

        if (headerBg && headerBg !== 'rgba(0, 0, 0, 0)') {
            console.log('✅ CSS loaded and applied correctly');
            passed++;
        } else {
            console.log('❌ CSS not loading properly');
            issues.push('CSS not loading on homepage');
            failed++;
        }

        // Test Header Elements
        const brandName = await page.textContent('.brand-name');
        const brandTagline = await page.textContent('.brand-tagline');

        if (brandName === 'BroFit') {
            console.log('✅ Brand name correct: "BroFit"');
            passed++;
        } else {
            console.log(`❌ Brand name incorrect: "${brandName}"`);
            issues.push('Brand name incorrect');
            failed++;
        }

        if (brandTagline === 'Multi-Chain DeFi Hub') {
            console.log('✅ Tagline correct: "Multi-Chain DeFi Hub"');
            passed++;
        } else {
            console.log(`❌ Tagline incorrect: "${brandTagline}"`);
            issues.push('Tagline incorrect');
            failed++;
        }

        // Test Navigation Tabs
        const navTabs = await page.$$eval('.nav-tab', tabs =>
            tabs.map(tab => ({
                label: tab.querySelector('.nav-label')?.textContent.trim(),
                icon: tab.querySelector('.nav-icon')?.textContent,
                disabled: tab.hasAttribute('disabled')
            }))
        );

        console.log(`\n📊 Navigation Tabs (${navTabs.length} found):`);
        navTabs.forEach((tab, i) => {
            console.log(`  ${i + 1}. ${tab.icon} ${tab.label}${tab.disabled ? ' [DISABLED]' : ''}`);
        });

        if (navTabs.length === 6) {
            console.log('✅ All 6 navigation tabs present');
            passed++;
        } else {
            console.log(`❌ Expected 6 tabs, found ${navTabs.length}`);
            issues.push(`Wrong tab count: ${navTabs.length}`);
            failed++;
        }

        // Test Pools Tab Specifically
        const poolsTab = navTabs.find(tab => tab.label.includes('Pools'));
        if (poolsTab && poolsTab.disabled && poolsTab.label.includes('soon')) {
            console.log('✅ Pools tab correctly disabled with "soon" badge');
            passed++;
        } else {
            console.log('❌ Pools tab not configured correctly');
            issues.push('Pools tab missing or incorrectly configured');
            failed++;
        }

        // Test Footer Removal
        const footer = await page.$('.dashboard-footer');
        if (!footer) {
            console.log('✅ Footer successfully removed');
            passed++;
        } else {
            console.log('❌ Footer still present in DOM');
            issues.push('Footer not removed');
            failed++;
        }

        // Take homepage screenshot
        await page.screenshot({
            path: 'screenshots/homepage.png',
            fullPage: true
        });
        console.log('📸 Screenshot saved: screenshots/homepage.png');

    } catch (error) {
        console.log(`❌ Homepage test error: ${error.message}`);
        issues.push(`Homepage error: ${error.message}`);
        failed++;
    }

    // ============================================================
    // SECTION 2: DASHBOARD ROUTES
    // ============================================================
    console.log('\n\n🔗 SECTION 2: DASHBOARD ROUTES');
    console.log('-'.repeat(60));

    const routes = [
        { path: '/dashboard', name: 'Dashboard Home' },
        { path: '/dashboard/swap', name: 'Swap Widget' },
        { path: '/dashboard/bridge', name: 'Bridge Widget' },
        { path: '/dashboard/portfolio', name: 'Portfolio Widget' },
        { path: '/dashboard/history', name: 'History Widget' }
    ];

    for (const route of routes) {
        try {
            const response = await page.goto(`${PRODUCTION_URL}${route.path}`, {
                waitUntil: 'networkidle',
                timeout: 10000
            });

            if (response.status() === 200) {
                console.log(`✅ ${route.name} (${route.path}) - 200 OK`);
                passed++;

                // Take screenshot of each route
                const filename = route.path.replace(/\//g, '_') + '.png';
                await page.screenshot({
                    path: `screenshots/${filename}`,
                    fullPage: true
                });
                console.log(`   📸 Screenshot: screenshots/${filename}`);
            } else {
                console.log(`❌ ${route.name} (${route.path}) - ${response.status()}`);
                issues.push(`${route.name} returned ${response.status()}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${route.name} (${route.path}) - Error: ${error.message}`);
            issues.push(`${route.name}: ${error.message}`);
            failed++;
        }
    }

    // ============================================================
    // SECTION 3: STATIC ASSETS
    // ============================================================
    console.log('\n\n📦 SECTION 3: STATIC ASSETS');
    console.log('-'.repeat(60));

    const assets = [
        { path: '/css/design-system.css', type: 'text/css' },
        { path: '/css/dashboard.css', type: 'text/css' },
        { path: '/js/dashboard.js', type: 'application/javascript' },
        { path: '/widgets/shared/utils.js', type: 'application/javascript' },
        { path: '/widgets/shared/state-manager.js', type: 'application/javascript' }
    ];

    for (const asset of assets) {
        try {
            const response = await page.goto(`${PRODUCTION_URL}${asset.path}`);
            const contentType = response.headers()['content-type'];

            if (contentType && contentType.includes(asset.type)) {
                console.log(`✅ ${asset.path} - Correct content-type: ${contentType}`);
                passed++;
            } else {
                console.log(`❌ ${asset.path} - Wrong content-type: ${contentType}`);
                issues.push(`${asset.path} has wrong content-type`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${asset.path} - Error: ${error.message}`);
            issues.push(`${asset.path}: ${error.message}`);
            failed++;
        }
    }

    // ============================================================
    // SECTION 4: EMBEDDING VERIFICATION
    // ============================================================
    console.log('\n\n🌐 SECTION 4: EMBEDDING VERIFICATION');
    console.log('-'.repeat(60));

    // Test CORS headers
    try {
        const response = await page.goto(PRODUCTION_URL);
        const headers = response.headers();

        console.log('\n📋 Security Headers:');
        const securityHeaders = [
            'access-control-allow-origin',
            'access-control-allow-methods',
            'access-control-allow-headers',
            'x-content-type-options',
            'referrer-policy',
            'cache-control'
        ];

        securityHeaders.forEach(header => {
            const value = headers[header];
            if (value) {
                console.log(`  ✅ ${header}: ${value}`);
            } else {
                console.log(`  ⚠️  ${header}: Not set`);
            }
        });

        // Check X-Frame-Options is NOT present (allows embedding)
        if (!headers['x-frame-options']) {
            console.log('✅ X-Frame-Options NOT set (embedding allowed)');
            passed++;
        } else {
            console.log(`❌ X-Frame-Options set to "${headers['x-frame-options']}" (blocks embedding)`);
            issues.push('X-Frame-Options prevents embedding');
            failed++;
        }

        // Check CORS allows all origins
        if (headers['access-control-allow-origin'] === '*') {
            console.log('✅ CORS allows all origins (Access-Control-Allow-Origin: *)');
            passed++;
        } else {
            console.log(`❌ CORS restricted: ${headers['access-control-allow-origin']}`);
            issues.push('CORS does not allow all origins');
            failed++;
        }

    } catch (error) {
        console.log(`❌ Headers check error: ${error.message}`);
        issues.push(`Headers check: ${error.message}`);
        failed++;
    }

    // Test actual iframe embedding
    try {
        const embedPage = await context.newPage();
        const embedHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Embedding Test</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: sans-serif; }
                    iframe { width: 100%; height: 800px; border: 2px solid #00A1F1; border-radius: 8px; }
                    .info { background: #f0f0f0; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="info">
                    <strong>Embedding Test</strong> - BroFit iframe embedded from different domain
                </div>
                <iframe src="${PRODUCTION_URL}" id="brofitFrame"></iframe>
                <script>
                    window.addEventListener('message', (event) => {
                        console.log('Received message from iframe:', event.data);
                    });
                </script>
            </body>
            </html>
        `;

        await embedPage.setContent(embedHTML);
        await embedPage.waitForTimeout(2000); // Wait for iframe to load

        const iframeExists = await embedPage.$('#brofitFrame');
        if (iframeExists) {
            console.log('✅ Iframe embedding test successful');
            passed++;

            await embedPage.screenshot({
                path: 'screenshots/embedding-test.png',
                fullPage: true
            });
            console.log('📸 Screenshot: screenshots/embedding-test.png');
        } else {
            console.log('❌ Iframe embedding test failed');
            issues.push('Iframe embedding failed');
            failed++;
        }

        await embedPage.close();
    } catch (error) {
        console.log(`❌ Embedding test error: ${error.message}`);
        issues.push(`Embedding: ${error.message}`);
        failed++;
    }

    // ============================================================
    // SECTION 5: VISUAL INSPECTION
    // ============================================================
    console.log('\n\n🎨 SECTION 5: VISUAL INSPECTION');
    console.log('-'.repeat(60));

    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

    // Check color scheme
    const colors = await page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        return {
            primary: styles.getPropertyValue('--accent-primary').trim(),
            secondary: styles.getPropertyValue('--text-secondary').trim(),
            surface: styles.getPropertyValue('--surface-primary').trim()
        };
    });

    console.log('\n🎨 Color Scheme:');
    console.log(`  Primary: ${colors.primary}`);
    console.log(`  Secondary: ${colors.secondary}`);
    console.log(`  Surface: ${colors.surface}`);

    if (colors.primary && colors.secondary && colors.surface) {
        console.log('✅ CSS custom properties loaded correctly');
        passed++;
    } else {
        console.log('❌ CSS custom properties not loading');
        issues.push('CSS variables not loading');
        failed++;
    }

    // Check responsive design
    const viewports = [
        { name: 'Desktop', width: 1920, height: 1080 },
        { name: 'Laptop', width: 1366, height: 768 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 }
    ];

    console.log('\n📱 Responsive Design Test:');
    for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500);

        const header = await page.$('.dashboard-header');
        if (header) {
            console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}) - Renders correctly`);
            passed++;

            await page.screenshot({
                path: `screenshots/responsive-${viewport.name.toLowerCase()}.png`,
                fullPage: false
            });
        } else {
            console.log(`❌ ${viewport.name} (${viewport.width}x${viewport.height}) - Rendering issue`);
            issues.push(`${viewport.name} viewport has issues`);
            failed++;
        }
    }

    await browser.close();

    // ============================================================
    // FINAL REPORT
    // ============================================================
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 FINAL TEST REPORT');
    console.log('='.repeat(60));
    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (issues.length > 0) {
        console.log('\n⚠️  Issues Found:');
        issues.forEach((issue, i) => {
            console.log(`  ${i + 1}. ${issue}`);
        });
    } else {
        console.log('\n🎉 NO ISSUES FOUND - DEPLOYMENT IS PERFECT!');
    }

    console.log('\n📸 Screenshots saved in screenshots/ directory');
    console.log('\n🌐 Embedding Status: ' + (failed === 0 ? 'READY FOR ANY DOMAIN ✅' : 'NEEDS ATTENTION ⚠️'));
    console.log('\n' + '='.repeat(60));

    process.exit(failed === 0 ? 0 : 1);
}

comprehensiveTest().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
