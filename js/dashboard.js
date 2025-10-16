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

        // Notify iframe widgets of wallet connection
        this.notifyWidgets({
            type: 'WALLET_CONNECTED',
            address,
            chainId
        });
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

        // Update UI
        this.updateWalletUI(null);

        // Notify iframe widgets of wallet disconnect
        this.notifyWidgets({
            type: 'WALLET_DISCONNECTED'
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
     * Load portfolio data from Moralis
     */
    async loadPortfolioData(address) {
        // Use Moralis configuration from portfolio widget
        const MORALIS_CONFIG = {
            apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjMxNjI2NjUyLTBkZWYtNGU2Yy04YmNlLWNmZDhjN2NkMTM4NiIsIm9yZ0lkIjoiNDI4NDQ1IiwidXNlcklkIjoiNDQwODg3IiwidHlwZUlkIjoiNDBlZTQ5ZjItMmVhZC00ZDFlLTg3NzAtY2E2MGU3YTU3YWU3IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3Mzc4MDAxMDAsImV4cCI6NDg5MzU2MDEwMH0.nWPT_KjvzZ4XBMH93wdWMGMQaBXBuAEvzGg-gPxxSSQ',
            baseUrl: 'https://deep-index.moralis.io/api/v2.2',
            supportedChains: ['eth', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche']
        };

        window.stateManager.setPortfolioLoading(true);

        try {
            const allTokens = [];

            // Fetch tokens from each chain
            for (const chain of MORALIS_CONFIG.supportedChains) {
                try {
                    const response = await fetch(
                        `${MORALIS_CONFIG.baseUrl}/wallets/${address}/tokens?chain=${chain}`,
                        {
                            method: 'GET',
                            headers: {
                                'accept': 'application/json',
                                'X-API-Key': MORALIS_CONFIG.apiKey
                            }
                        }
                    );

                    if (!response.ok) {
                        console.warn(`⚠️ ${chain} API error: ${response.status}`);
                        continue;
                    }

                    const data = await response.json();
                    const tokens = (data.result || []).map(token => ({
                        ...token,
                        chain: chain
                    }));

                    allTokens.push(...tokens);
                } catch (chainError) {
                    console.error(`❌ Error fetching ${chain}:`, chainError);
                }
            }

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

            // Update state manager
            window.stateManager.setPortfolio(holdings);

            console.log(`✅ Portfolio loaded: ${holdings.length} tokens`);
        } catch (error) {
            console.error('❌ Failed to load portfolio:', error);
            window.stateManager.setPortfolio([]);
        } finally {
            window.stateManager.setPortfolioLoading(false);
        }
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
