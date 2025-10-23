/**
 * Test each widget page for embedding compatibility
 * Verifies all routes are accessible and can be embedded
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app';

const WIDGETS = [
    {
        name: 'Dashboard Home',
        path: '/dashboard',
        description: 'Main dashboard with portfolio overview, quick actions, recent activity, and top holdings',
        icon: '🏠',
        useCase: 'Overview page showing multi-chain DeFi hub dashboard'
    },
    {
        name: 'Swap Widget',
        path: '/dashboard/swap',
        description: 'Token swap interface powered by RocketX - swap tokens across 10+ supported chains',
        icon: '🔄',
        useCase: 'Token swapping across Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, Fantom, etc.'
    },
    {
        name: 'Bridge Widget',
        path: '/dashboard/bridge',
        description: 'Cross-chain bridge interface - move assets between different blockchain networks',
        icon: '🌉',
        useCase: 'Bridge tokens from one chain to another (e.g., ETH → Polygon, BSC → Arbitrum)'
    },
    {
        name: 'Portfolio Widget',
        path: '/dashboard/portfolio',
        description: 'Multi-chain portfolio tracker showing all your token holdings across supported networks',
        icon: '💼',
        useCase: 'View aggregated wallet balances, token values, and chain distribution'
    },
    {
        name: 'History Widget',
        path: '/dashboard/history',
        description: 'Transaction history tracker for all swap and bridge operations',
        icon: '📜',
        useCase: 'Review past transactions with status, timestamps, and transaction hashes'
    }
];

async function testWidgetEmbedding() {
    console.log('🧪 WIDGET EMBEDDING VERIFICATION\n');
    console.log('='.repeat(70));
    console.log(`Testing ${WIDGETS.length} widget pages for embedding compatibility\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });

    const results = [];

    for (const widget of WIDGETS) {
        console.log(`\n${widget.icon} Testing: ${widget.name}`);
        console.log('-'.repeat(70));

        const page = await context.newPage();

        try {
            // Test 1: Direct access
            const response = await page.goto(`${PRODUCTION_URL}${widget.path}`, {
                waitUntil: 'networkidle',
                timeout: 15000
            });

            const statusOk = response.status() === 200;
            console.log(`  Direct Access: ${statusOk ? '✅' : '❌'} (${response.status()})`);

            // Test 2: Check headers for embedding
            const headers = response.headers();
            const noXFrameOptions = !headers['x-frame-options'];
            const corsAllowAll = headers['access-control-allow-origin'] === '*';

            console.log(`  X-Frame-Options: ${noXFrameOptions ? '✅ Not Set (allows embedding)' : '❌ Set (blocks embedding)'}`);
            console.log(`  CORS Policy: ${corsAllowAll ? '✅ Allow All Origins' : '⚠️  Restricted'}`);

            // Test 3: Verify content loads
            await page.waitForTimeout(1000);
            const hasHeader = await page.$('.dashboard-header');
            const hasContent = await page.$('.dashboard-main, .widget-container, .widget-frame');

            console.log(`  Header Rendered: ${hasHeader ? '✅' : '❌'}`);
            console.log(`  Content Loaded: ${hasContent ? '✅' : '❌'}`);

            // Test 4: Test actual iframe embedding
            const embedPage = await context.newPage();
            const embedHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Embed Test: ${widget.name}</title>
                    <style>
                        body { margin: 20px; font-family: system-ui; }
                        .info { background: #f0f0f0; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
                        iframe { width: 100%; height: 700px; border: 2px solid #3EB85F; border-radius: 12px; }
                    </style>
                </head>
                <body>
                    <div class="info">
                        <strong>Docusaurus Embed Preview:</strong> ${widget.name}
                    </div>
                    <iframe
                        src="${PRODUCTION_URL}${widget.path}"
                        id="widgetFrame"
                        allow="clipboard-write"
                        loading="lazy">
                    </iframe>
                </body>
                </html>
            `;

            await embedPage.setContent(embedHTML);
            await embedPage.waitForTimeout(2000);

            const iframeWorks = await embedPage.$('#widgetFrame');
            console.log(`  Iframe Embedding: ${iframeWorks ? '✅ Works' : '❌ Failed'}`);

            // Take screenshot of embedded version
            await embedPage.screenshot({
                path: `screenshots/embed-${widget.path.replace(/\//g, '_')}.png`,
                fullPage: false
            });
            console.log(`  📸 Screenshot: screenshots/embed-${widget.path.replace(/\//g, '_')}.png`);

            await embedPage.close();

            // Overall result
            const allPassed = statusOk && noXFrameOptions && corsAllowAll && hasHeader && hasContent && iframeWorks;

            results.push({
                widget: widget.name,
                path: widget.path,
                description: widget.description,
                icon: widget.icon,
                useCase: widget.useCase,
                passed: allPassed,
                url: `${PRODUCTION_URL}${widget.path}`
            });

            console.log(`\n  Overall Status: ${allPassed ? '✅ READY FOR DOCUSAURUS' : '⚠️  NEEDS ATTENTION'}`);

        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            results.push({
                widget: widget.name,
                path: widget.path,
                description: widget.description,
                icon: widget.icon,
                useCase: widget.useCase,
                passed: false,
                url: `${PRODUCTION_URL}${widget.path}`,
                error: error.message
            });
        }

        await page.close();
    }

    await browser.close();

    // Generate Docusaurus embed documentation
    console.log('\n\n' + '='.repeat(70));
    console.log('📋 DOCUSAURUS EMBEDDING GUIDE');
    console.log('='.repeat(70));

    const allPassed = results.every(r => r.passed);
    console.log(`\n✅ Embedding Status: ${allPassed ? 'ALL WIDGETS READY' : 'SOME ISSUES FOUND'}\n`);

    console.log('Copy-paste ready iframe code for each widget:\n');

    results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.icon} ${result.widget}`);
        console.log('-'.repeat(70));
        console.log(`Description: ${result.description}`);
        console.log(`Use Case: ${result.useCase}`);
        console.log(`URL: ${result.url}`);
        console.log(`Status: ${result.passed ? '✅ Ready' : '❌ Not Ready'}\n`);

        if (result.passed) {
            console.log('Docusaurus MDX Code:');
            console.log('```jsx');
            console.log(`<iframe`);
            console.log(`  src="${result.url}"`);
            console.log(`  width="100%"`);
            console.log(`  height="700"`);
            console.log(`  frameBorder="0"`);
            console.log(`  allow="clipboard-write"`);
            console.log(`  loading="lazy"`);
            console.log(`  style={{ border: '2px solid #3EB85F', borderRadius: '12px', marginTop: '20px' }}`);
            console.log(`  title="${result.widget}">`);
            console.log(`</iframe>`);
            console.log('```\n');
        }
    });

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    const passedCount = results.filter(r => r.passed).length;
    console.log(`\n✅ Passed: ${passedCount}/${results.length}`);
    console.log(`❌ Failed: ${results.length - passedCount}/${results.length}`);

    if (allPassed) {
        console.log('\n🎉 ALL WIDGETS ARE READY FOR DOCUSAURUS EMBEDDING!');
        console.log('Copy the iframe code above and paste into your .mdx files\n');
    }

    console.log('='.repeat(70));

    process.exit(allPassed ? 0 : 1);
}

testWidgetEmbedding().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
