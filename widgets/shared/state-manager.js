/* ========================================
   💪 BROFIT STATE MANAGER
   Unified state management for dashboard
   ======================================== */

/**
 * Global State Manager
 * Handles shared state across all widgets with observer pattern
 */
class StateManager {
    constructor() {
        this.state = {
            // Wallet State
            wallet: {
                address: null,
                connected: false,
                provider: null,
                chainId: null,
                balance: '0.00'
            },

            // Chain State
            chain: {
                id: 1,
                name: 'Ethereum',
                symbol: 'ETH',
                rpcUrl: null
            },

            // Portfolio State
            portfolio: {
                holdings: [],
                totalValue: 0,
                change24h: 0,
                activeChains: 0,
                totalAssets: 0,
                lastUpdated: null,
                isLoading: false
            },

            // Transaction History
            history: {
                transactions: [],
                lastUpdated: null
            },

            // UI State
            ui: {
                activeRoute: 'dashboard',
                sidebarOpen: false,
                theme: 'light'
            }
        };

        // Observers for state changes
        this.observers = {};

        // Initialize from localStorage
        this.loadFromStorage();

        console.log('✅ StateManager initialized:', this.state);
    }

    /**
     * Get current state or specific path
     */
    getState(path = null) {
        if (!path) return this.state;

        const keys = path.split('.');
        let value = this.state;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Update state and notify observers
     */
    setState(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;

        // Navigate to the parent object
        for (const key of keys) {
            if (!(key in target)) {
                target[key] = {};
            }
            target = target[key];
        }

        // Update value
        const oldValue = target[lastKey];
        target[lastKey] = value;

        console.log(`📝 State updated: ${path}`, { oldValue, newValue: value });

        // Notify observers
        this.notifyObservers(path, value, oldValue);

        // Save to localStorage (debounced to prevent excessive writes)
        this.debouncedSaveToStorage();

        // Emit custom event
        this.emitStateChange(path, value, oldValue);
    }

    /**
     * Subscribe to state changes
     */
    subscribe(path, callback) {
        if (!this.observers[path]) {
            this.observers[path] = [];
        }

        this.observers[path].push(callback);

        // Return unsubscribe function
        return () => {
            this.observers[path] = this.observers[path].filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all observers of a state change
     */
    notifyObservers(path, newValue, oldValue) {
        // Notify exact path observers
        if (this.observers[path]) {
            this.observers[path].forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`❌ Observer error for ${path}:`, error);
                }
            });
        }

        // Notify parent path observers (e.g., 'wallet' when 'wallet.address' changes)
        const parentPath = path.split('.').slice(0, -1).join('.');
        if (parentPath && this.observers[parentPath]) {
            this.observers[parentPath].forEach(callback => {
                try {
                    callback(this.getState(parentPath), null);
                } catch (error) {
                    console.error(`❌ Parent observer error for ${parentPath}:`, error);
                }
            });
        }
    }

    /**
     * Emit CustomEvent for state changes
     */
    emitStateChange(path, newValue, oldValue) {
        const event = new CustomEvent('stateChange', {
            detail: { path, newValue, oldValue }
        });
        window.dispatchEvent(event);
    }

    /**
     * Wallet Methods
     */
    setWallet(address, provider, chainId) {
        this.setState('wallet.address', address);
        this.setState('wallet.provider', provider);
        this.setState('wallet.chainId', chainId);
        this.setState('wallet.connected', !!address);

        console.log('✅ Wallet connected:', { address, chainId });
    }

    disconnectWallet() {
        this.setState('wallet.address', null);
        this.setState('wallet.provider', null);
        this.setState('wallet.chainId', null);
        this.setState('wallet.connected', false);
        this.setState('wallet.balance', '0.00');

        console.log('🔌 Wallet disconnected');
    }

    /**
     * Chain Methods
     */
    setChain(chainId, name, symbol, rpcUrl) {
        this.setState('chain.id', chainId);
        this.setState('chain.name', name);
        this.setState('chain.symbol', symbol);
        this.setState('chain.rpcUrl', rpcUrl);

        console.log('⛓️ Chain updated:', { chainId, name });
    }

    /**
     * Portfolio Methods
     */
    setPortfolio(portfolioData) {
        // Handle both old format (just holdings array) and new format (full object)
        if (Array.isArray(portfolioData)) {
            // Old format: just holdings array
            const holdings = portfolioData;
            this.setState('portfolio.holdings', holdings);

            // Calculate derived values
            const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
            const weightedChange = holdings.reduce((sum, h) => {
                return sum + ((h.value || 0) * (h.change24h || 0));
            }, 0) / (totalValue || 1);

            const activeChains = [...new Set(holdings.map(h => h.chain))].length;

            this.setState('portfolio.totalValue', totalValue);
            this.setState('portfolio.change24h', weightedChange);
            this.setState('portfolio.activeChains', activeChains);
            this.setState('portfolio.totalAssets', holdings.length);
            this.setState('portfolio.lastUpdated', new Date().toISOString());

            console.log('💼 Portfolio updated:', {
                assets: holdings.length,
                value: totalValue,
                chains: activeChains
            });
        } else {
            // New format: full portfolio object with pre-calculated values
            const { holdings, totalValue, change24h, activeChains, totalAssets } = portfolioData;

            // Ensure holdings is an array
            const holdingsArray = Array.isArray(holdings) ? holdings : [];

            this.setState('portfolio.holdings', holdingsArray);
            this.setState('portfolio.totalValue', totalValue || 0);
            this.setState('portfolio.change24h', change24h || 0);
            this.setState('portfolio.activeChains', activeChains || 0);
            this.setState('portfolio.totalAssets', totalAssets || holdingsArray.length);
            this.setState('portfolio.lastUpdated', new Date().toISOString());

            console.log('💼 Portfolio updated:', {
                assets: holdingsArray.length,
                value: totalValue,
                chains: activeChains
            });
        }
    }

    setPortfolioLoading(isLoading) {
        this.setState('portfolio.isLoading', isLoading);
    }

    /**
     * History Methods
     */
    addTransaction(transaction) {
        const transactions = this.getState('history.transactions') || [];
        transactions.unshift(transaction); // Add to beginning

        // Keep only last 50 transactions
        if (transactions.length > 50) {
            transactions.length = 50;
        }

        this.setState('history.transactions', transactions);
        this.setState('history.lastUpdated', new Date().toISOString());

        console.log('📝 Transaction added:', transaction.id);
    }

    updateTransaction(id, updates) {
        const transactions = this.getState('history.transactions') || [];
        const index = transactions.findIndex(tx => tx.id === id);

        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates };
            this.setState('history.transactions', transactions);
            console.log('✅ Transaction updated:', id);
        }
    }

    /**
     * UI Methods
     */
    setRoute(route) {
        this.setState('ui.activeRoute', route);
        console.log('🧭 Route changed:', route);
    }

    setTheme(theme) {
        this.setState('ui.theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        console.log('🎨 Theme changed:', theme);
    }

    toggleSidebar() {
        const isOpen = this.getState('ui.sidebarOpen');
        this.setState('ui.sidebarOpen', !isOpen);
    }

    /**
     * Persistence Methods
     */
    debouncedSaveToStorage() {
        // Use storageUtils for debounced save (500ms delay)
        if (window.storageUtils) {
            const stateToSave = {
                wallet: {
                    address: this.state.wallet.address,
                    connected: this.state.wallet.connected,
                    chainId: this.state.wallet.chainId
                },
                chain: this.state.chain,
                portfolio: {
                    lastUpdated: this.state.portfolio.lastUpdated
                },
                history: this.state.history,
                ui: this.state.ui
            };

            window.storageUtils.debouncedSave('brofit_state', stateToSave, 500);
        } else {
            // Fallback to immediate save if storageUtils not loaded
            this.saveToStorage();
        }
    }

    saveToStorage() {
        try {
            const stateToSave = {
                wallet: {
                    address: this.state.wallet.address,
                    connected: this.state.wallet.connected,
                    chainId: this.state.wallet.chainId
                },
                chain: this.state.chain,
                portfolio: {
                    lastUpdated: this.state.portfolio.lastUpdated
                },
                history: this.state.history,
                ui: this.state.ui
            };

            localStorage.setItem('brofit_state', JSON.stringify(stateToSave));
        } catch (error) {
            console.error('❌ Failed to save state:', error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('brofit_state');
            if (saved) {
                const parsed = JSON.parse(saved);

                // Restore wallet state (but not provider)
                if (parsed.wallet) {
                    this.state.wallet.address = parsed.wallet.address;
                    this.state.wallet.connected = parsed.wallet.connected;
                    this.state.wallet.chainId = parsed.wallet.chainId;
                }

                // Restore chain state
                if (parsed.chain) {
                    this.state.chain = { ...this.state.chain, ...parsed.chain };
                }

                // Restore history
                if (parsed.history) {
                    this.state.history = parsed.history;
                }

                // Restore UI state
                if (parsed.ui) {
                    this.state.ui = { ...this.state.ui, ...parsed.ui };

                    // Apply theme
                    if (parsed.ui.theme) {
                        document.documentElement.setAttribute('data-theme', parsed.ui.theme);
                    }
                }

                console.log('✅ State loaded from localStorage');
            }
        } catch (error) {
            console.error('❌ Failed to load state:', error);
        }
    }

    clearStorage() {
        localStorage.removeItem('brofit_state');
        console.log('🗑️ State storage cleared');
    }

    /**
     * Debug Methods
     */
    debugState() {
        console.log('🔍 Current State:', this.state);
        console.log('👥 Observers:', this.observers);
    }

    exportState() {
        return JSON.stringify(this.state, null, 2);
    }
}

// Create global singleton instance
window.stateManager = new StateManager();

console.log('✅ Global StateManager ready: window.stateManager');

// Convenience helper functions
window.getState = (path) => window.stateManager.getState(path);
window.setState = (path, value) => window.stateManager.setState(path, value);
window.subscribe = (path, callback) => window.stateManager.subscribe(path, callback);
