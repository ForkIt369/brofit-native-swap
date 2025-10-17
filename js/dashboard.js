/* ========================================
   💪 BROFIT DASHBOARD CONTROLLER
   Main dashboard logic and navigation
   ======================================== */

/**
 * Dashboard Controller
 */
class DashboardController {
    constructor() {
        this.routes = {
            'dashboard': { title: 'Dashboard', url: null, showHome: true },
            'swap': { title: 'Swap', url: '/widgets/swap.html', showHome: false },
            'bridge': { title: 'Bridge', url: '/widgets/bridge.html', showHome: false },
            'portfolio': { title: 'Portfolio', url: '/widgets/portfolio.html', showHome: false },
            'history': { title: 'History', url: '/widgets/history.html', showHome: false }
        };

        this.currentRoute = 'dashboard';
        this.walletConnected = false;

        this.init();
    }

    /**
     * Initialize dashboard
     */
    async init() {
        console.log('🚀 Initializing BroFit Dashboard...');

        // Setup event listeners
        this.setupNavigation();
        this.setupWalletEvents();
        this.setupStateSubscriptions();

        // Check initial wallet state
        await this.checkWalletConnection();

        // Handle initial route from URL hash
        this.handleInitialRoute();

        // Load dashboard home data
        await this.loadDashboardData();

        console.log('✅ Dashboard initialized');
    }

    /**
     * Setup navigation event listeners
     */
    setupNavigation() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const route = e.currentTarget.getAttribute('data-route');
                this.navigateTo(route);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const route = e.state?.route || 'dashboard';
            this.navigateTo(route, false); // Don't push to history
        });

        console.log('✅ Navigation setup complete');
    }

    /**
     * Setup wallet event listeners
     */
    setupWalletEvents() {
        // Connect wallet button
        const connectBtn = document.getElementById('connectWalletBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', async () => {
                await this.connectWallet();
            });
        }

        // Listen for MetaMask events
        if (window.ethereum) {
            // Account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('👤 Account changed:', accounts[0]);
                if (accounts.length === 0) {
                    this.handleWalletDisconnect();
                } else {
                    this.handleWalletConnect(accounts[0]);
                }
            });

            // Chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('⛓️ Chain changed:', chainId);
                window.location.reload(); // Recommended by MetaMask
            });
        }

        // Refresh portfolio button
        const refreshBtn = document.getElementById('refreshPortfolio');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.loadDashboardData();
            });
        }

        console.log('✅ Wallet events setup complete');
    }

    /**
     * Setup state manager subscriptions
     */
    setupStateSubscriptions() {
        // Subscribe to wallet changes
        window.subscribe('wallet.address', (address) => {
            this.updateWalletUI(address);
        });

        // Subscribe to portfolio changes
        window.subscribe('portfolio', (portfolio) => {
            this.updateDashboardStats(portfolio);
        });

        // Subscribe to history changes
        window.subscribe('history.transactions', (transactions) => {
            this.updateRecentActivity(transactions);
        });

        console.log('✅ State subscriptions setup complete');
    }

    /**
     * Check if wallet is already connected
     */
    async checkWalletConnection() {
        try {
            const address = await getWalletAddress();

            if (address) {
                console.log('✅ Wallet already connected:', address);
                this.handleWalletConnect(address);
            } else {
                console.log('⚠️ No wallet connected');
                this.handleWalletDisconnect();
            }
        } catch (error) {
            console.error('❌ Failed to check wallet:', error);
        }
    }

    /**
     * Connect wallet
     */
    async connectWallet() {
        try {
            showNotification('Connecting to MetaMask...', 'info', 2000);

            const wallet = await connectWallet();

            if (wallet && wallet.address) {
                this.handleWalletConnect(wallet.address, wallet.chainId);
                showNotification('Wallet connected successfully!', 'success', 3000);
            }
        } catch (error) {
            console.error('❌ Failed to connect wallet:', error);
            showNotification('Failed to connect wallet: ' + error.message, 'error', 5000);
        }
    }

    /**
     * Handle wallet connection
     */
    handleWalletConnect(address, chainId = null) {
        this.walletConnected = true;

        // Update state manager
        window.stateManager.setWallet(address, window.ethereum, chainId);

        // IMPORTANT: Also save to localStorage for iframe widgets
        localStorage.setItem('brofit_connected_wallet', JSON.stringify({
            address,
            chainId,
            connected: true,
            timestamp: Date.now()
        }));

        // Update UI
        this.updateWalletUI(address);

        // Load portfolio data
        this.loadPortfolioData(address);

        // Notify iframe widgets of wallet connection (lowercase for widget compatibility)
        this.notifyWidgets({
            type: 'wallet_connected',
            address,
            chainId
        });

        // Also save to simple localStorage key for widget access
        localStorage.setItem('brofit_wallet_address', address);
    }

    /**
     * Handle wallet disconnect
     */
    handleWalletDisconnect() {
        this.walletConnected = false;

        // Update state manager
        window.stateManager.disconnectWallet();

        // Clear localStorage
        localStorage.removeItem('brofit_connected_wallet');
        localStorage.removeItem('brofit_wallet_address');

        // Update UI
        this.updateWalletUI(null);

        // Notify iframe widgets of wallet disconnect (lowercase for widget compatibility)
        this.notifyWidgets({
            type: 'wallet_disconnected'
        });
    }

    /**
     * Notify iframe widgets of state changes
     */
    notifyWidgets(message) {
        const widgetFrame = document.getElementById('widgetFrame');
        if (widgetFrame && widgetFrame.contentWindow) {
            widgetFrame.contentWindow.postMessage(message, '*');
        }
    }

    /**
     * Update wallet UI
     */
    updateWalletUI(address) {
        const walletInfo = document.getElementById('walletInfo');
        const walletAddressEl = document.getElementById('walletAddress');
        const connectBtn = document.getElementById('connectWalletBtn');

        if (address) {
            // Show wallet info
            if (walletInfo) walletInfo.style.display = 'flex';
            if (connectBtn) connectBtn.style.display = 'none';

            // Update address
            if (walletAddressEl) {
                const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
                walletAddressEl.textContent = short;
            }

            // Update chain info
            const chainName = window.getState('chain.name') || 'Ethereum';
            const chainEl = document.getElementById('walletChain');
            if (chainEl) chainEl.textContent = chainName;
        } else {
            // Show connect button
            if (walletInfo) walletInfo.style.display = 'none';
            if (connectBtn) connectBtn.style.display = 'block';
        }
    }

    /**
     * Navigate to route
     */
    navigateTo(route, pushState = true) {
        if (!this.routes[route]) {
            console.error('❌ Invalid route:', route);
            return;
        }

        console.log('🧭 Navigating to:', route);

        this.currentRoute = route;
        const routeConfig = this.routes[route];

        // Update state manager
        window.stateManager.setRoute(route);

        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (tab.getAttribute('data-route') === route) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update page title
        document.title = `BroFit | ${routeConfig.title}`;

        // Show appropriate view
        const dashboardHome = document.getElementById('dashboardHome');
        const widgetFrame = document.getElementById('widgetFrame');

        if (routeConfig.showHome) {
            // Show dashboard home
            if (dashboardHome) dashboardHome.style.display = 'block';
            if (widgetFrame) widgetFrame.style.display = 'none';
        } else {
            // Load widget in iframe
            if (dashboardHome) dashboardHome.style.display = 'none';
            if (widgetFrame) {
                widgetFrame.style.display = 'block';
                widgetFrame.src = routeConfig.url;
            }
        }

        // Update browser history
        if (pushState) {
            const url = route === 'dashboard' ? '/dashboard' : `/dashboard/${route}`;
            window.history.pushState({ route }, '', url);
        }
    }

    /**
     * Handle initial route from URL
     */
    handleInitialRoute() {
        const path = window.location.pathname;
        const match = path.match(/\/dashboard\/?(.+)?/);

        if (match && match[1]) {
            const route = match[1].replace('/', '');
            if (this.routes[route]) {
                this.navigateTo(route, false);
                return;
            }
        }

        // Default to dashboard
        this.navigateTo('dashboard', false);
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        const address = window.getState('wallet.address');

        if (!address) {
            console.log('⚠️ No wallet connected, skipping dashboard data load');
            return;
        }

        try {
            showNotification('Loading portfolio data...', 'info', 2000);

            // Load portfolio data
            await this.loadPortfolioData(address);

            // Load transaction history from localStorage
            this.loadTransactionHistory();

            showNotification('Dashboard data loaded', 'success', 2000);
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            showNotification('Failed to load data: ' + error.message, 'error', 5000);
        }
    }

    /**
     * Timeout wrapper for promises
     */
    withTimeout(promise, timeoutMs, errorMessage) {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
            )
        ]);
    }

    /**
     * Load portfolio data from Moralis (using new API wrapper)
     */
    async loadPortfolioData(address) {
        window.stateManager.setPortfolioLoading(true);

        // Show loading overlay with CBO avatar
        this.showLoadingState('Loading your portfolio from blockchain...');

        console.log('🔍 Starting portfolio load for address:', address);
        console.log('🔍 Checking if getMultiChainTokens is available:', typeof getMultiChainTokens);

        try {
            // Verify function exists
            if (typeof getMultiChainTokens !== 'function') {
                throw new Error('getMultiChainTokens is not defined. API modules may not be loaded.');
            }

            // Use the new Moralis API wrapper with timeout protection (60 seconds)
            console.log('📡 Fetching portfolio via Moralis API wrapper...');
            const allTokens = await this.withTimeout(
                getMultiChainTokens(address),
                60000, // 60 second timeout
                'Portfolio loading timed out after 60 seconds'
            );

            console.log(`📊 Received ${allTokens.length} tokens from API`);

            // Transform and filter tokens
            const holdings = allTokens
                .filter(token => {
                    const balance = parseFloat(token.balance_formatted || 0);
                    return balance > 0 && !token.possible_spam;
                })
                .map(token => ({
                    token: token.symbol || 'Unknown',
                    name: token.name || 'Unknown Token',
                    chain: token.chain || 'unknown',
                    balance: token.balance_formatted || '0',
                    value: parseFloat(token.usd_value || 0),
                    change24h: parseFloat(token.usd_price_24hr_percent_change || 0),
                    logo: token.logo || token.thumbnail || null,
                    contractAddress: token.token_address,
                    decimals: token.decimals || 18
                }))
                .sort((a, b) => b.value - a.value);

            console.log(`✅ Filtered to ${holdings.length} valid holdings`);

            // Calculate portfolio stats
            const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
            const totalChange24h = holdings.reduce((sum, h) => sum + (h.value * h.change24h / 100), 0);
            const activeChains = [...new Set(holdings.map(h => h.chain))].length;

            // Update state manager
            window.stateManager.setPortfolio({
                holdings,
                totalValue,
                change24h: totalValue > 0 ? (totalChange24h / totalValue * 100) : 0,
                activeChains,
                totalAssets: holdings.length
            });

            console.log(`✅ Portfolio loaded: ${holdings.length} tokens across ${activeChains} chains, $${totalValue.toFixed(2)} total value`);

            // Check if demo mode was used and notify user
            if (typeof checkDemoMode === 'function') {
                const isDemoMode = await checkDemoMode();
                if (isDemoMode) {
                    this.showDemoModeNotification();
                }
            }

            // Hide loading overlay
            this.hideLoadingState();
        } catch (error) {
            console.error('❌ Failed to load portfolio:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                address: address,
                getMultiChainTokensAvailable: typeof getMultiChainTokens !== 'undefined'
            });

            window.stateManager.setPortfolio({
                holdings: [],
                totalValue: 0,
                change24h: 0,
                activeChains: 0,
                totalAssets: 0
            });

            // Show error state with CBO avatar
            this.showErrorState(error.message || 'Failed to load portfolio data');
        } finally {
            console.log('🏁 Portfolio load complete, hiding loading state');
            window.stateManager.setPortfolioLoading(false);
        }
    }

    /**
     * Show loading state with CBO avatar
     */
    showLoadingState(message = 'Loading...') {
        let overlay = document.getElementById('loadingOverlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(18, 20, 30, 0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(8px);
            `;
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <img src="/avatars/cbo/cbo_processing_watch.png?v=2"
                 alt="CBO Processing"
                 style="width: 180px; height: auto; margin-bottom: 24px; animation: pulse 2s ease-in-out infinite;">
            <div style="color: white; font-size: 18px; font-weight: 600; text-align: center; max-width: 400px;">
                ${message}
            </div>
        `;
        overlay.style.display = 'flex';
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Show error state with CBO avatar
     */
    showErrorState(message) {
        let overlay = document.getElementById('loadingOverlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(18, 20, 30, 0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(8px);
            `;
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <img src="/avatars/cbo/cbo_cautious_reviewing.png?v=2"
                 alt="CBO Error"
                 style="width: 180px; height: auto; margin-bottom: 24px;">
            <div style="color: #ef4444; font-size: 18px; font-weight: 600; text-align: center; max-width: 400px; margin-bottom: 16px;">
                ${message}
            </div>
            <button onclick="window.dashboardController.hideLoadingState()"
                    style="padding: 12px 24px; background: #3EB85F; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                Close
            </button>
        `;
        overlay.style.display = 'flex';

        // Auto-hide after 8 seconds (increased for readability)
        setTimeout(() => this.hideLoadingState(), 8000);
    }

    /**
     * Show demo mode notification
     */
    showDemoModeNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            max-width: 400px;
            font-size: 14px;
            line-height: 1.5;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                🎭 Demo Mode Active
            </div>
            <div style="font-size: 13px; opacity: 0.95;">
                Showing sample portfolio data because the API key has expired.
                Get a new Moralis API key to view real portfolio data.
            </div>
        `;
        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 10000);
    }

    /**
     * Load transaction history
     */
    loadTransactionHistory() {
        try {
            const saved = localStorage.getItem('brofit_transactions');
            if (saved) {
                const transactions = JSON.parse(saved);
                window.stateManager.setState('history.transactions', transactions);
                console.log(`✅ Loaded ${transactions.length} transactions from localStorage`);
            }
        } catch (error) {
            console.error('❌ Failed to load transaction history:', error);
        }
    }

    /**
     * Update dashboard stats
     */
    updateDashboardStats(portfolio) {
        if (!portfolio) return;

        // Total portfolio value
        const totalValueEl = document.getElementById('totalPortfolioValue');
        if (totalValueEl) {
            totalValueEl.textContent = formatCurrency(portfolio.totalValue || 0);
        }

        // Wallet balance (in header)
        const walletBalanceEl = document.getElementById('walletBalance');
        if (walletBalanceEl) {
            walletBalanceEl.textContent = formatCurrency(portfolio.totalValue || 0);
        }

        // 24h change
        const changeEl = document.getElementById('portfolioChange24h');
        if (changeEl) {
            const change = portfolio.change24h || 0;
            const sign = change >= 0 ? '+' : '';
            changeEl.textContent = `${sign}${change.toFixed(2)}%`;
            changeEl.className = 'change-24h ' + (change >= 0 ? 'positive' : 'negative');
        }

        // Active chains
        const chainsEl = document.getElementById('dashboardActiveChains');
        if (chainsEl) {
            chainsEl.textContent = portfolio.activeChains || 0;
        }

        // Total assets
        const assetsEl = document.getElementById('dashboardTotalAssets');
        if (assetsEl) {
            assetsEl.textContent = portfolio.totalAssets || 0;
        }

        // Update top holdings list
        this.updateTopHoldings(portfolio.holdings || []);
    }

    /**
     * Update top holdings list
     */
    updateTopHoldings(holdings) {
        const listEl = document.getElementById('topHoldingsList');
        if (!listEl) return;

        if (!holdings || holdings.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <p>No holdings found</p>
                    <p class="empty-state-sub">Connect your wallet to view holdings</p>
                </div>
            `;
            return;
        }

        // Show top 3 holdings
        const topHoldings = holdings.slice(0, 3);
        listEl.innerHTML = topHoldings.map(holding => `
            <div class="holding-item">
                <div class="holding-icon">
                    ${holding.logo ?
                        `<img src="${holding.logo}" alt="${holding.token}" style="width: 24px; height: 24px; border-radius: 50%;" onerror="this.style.display='none'">` :
                        holding.token.substring(0, 2)
                    }
                </div>
                <div class="holding-info">
                    <div class="holding-name">${holding.token}</div>
                    <div class="holding-balance">${parseFloat(holding.balance).toFixed(4)}</div>
                </div>
                <div class="holding-value">
                    <div class="holding-usd">${formatCurrency(holding.value)}</div>
                    <div class="holding-change ${holding.change24h >= 0 ? 'positive' : 'negative'}">
                        ${holding.change24h >= 0 ? '+' : ''}${holding.change24h.toFixed(2)}%
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Update recent activity
     */
    updateRecentActivity(transactions) {
        const listEl = document.getElementById('recentActivityList');
        if (!listEl) return;

        if (!transactions || transactions.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <p>No recent transactions</p>
                    <p class="empty-state-sub">Your transaction history will appear here</p>
                </div>
            `;
            return;
        }

        // Show last 5 transactions
        const recentTxs = transactions.slice(0, 5);
        listEl.innerHTML = recentTxs.map(tx => `
            <div class="activity-item">
                <div class="activity-info">
                    <div class="activity-type">${tx.type || 'Transaction'}</div>
                    <div class="activity-time">${formatTimeAgo(new Date(tx.timestamp))}</div>
                </div>
                <div class="activity-status ${tx.status}">
                    ${tx.status === 'completed' ? '✅' : tx.status === 'pending' ? '⏳' : '❌'}
                </div>
            </div>
        `).join('');
    }
}

/**
 * Global navigation function
 */
window.navigateToRoute = function(route) {
    if (window.dashboardController) {
        window.dashboardController.navigateTo(route);
    }
};

/**
 * Initialize dashboard on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardController = new DashboardController();
});

console.log('✅ Dashboard controller loaded');
