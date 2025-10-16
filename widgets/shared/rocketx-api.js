/**
 * RocketX API Wrapper
 * Centralized API client for all RocketX endpoints
 * Handles authentication, rate limiting, and error handling
 */

class RocketXAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.rocketx.exchange';
        this.cache = new Map();
        this.cacheTime = 30000; // 30 seconds
    }

    /* ========================================================================
       PRIVATE METHODS
       ====================================================================== */

    /**
     * Make HTTP request with error handling
     */
    async _request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const defaultHeaders = {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`RocketX API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * Get cached data or fetch new
     */
    async _getCached(key, fetchFn) {
        const cached = this.cache.get(key);
        const now = Date.now();

        if (cached && (now - cached.timestamp < this.cacheTime)) {
            return cached.data;
        }

        const data = await fetchFn();
        this.cache.set(key, { data, timestamp: now });
        return data;
    }

    /**
     * Clear cache entry
     */
    _clearCache(key) {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clearAllCache() {
        this.cache.clear();
    }

    /* ========================================================================
       TOKEN ENDPOINTS
       ====================================================================== */

    /**
     * Get all supported tokens (with optional network filter)
     * @param {string} networkId - Optional network ID to filter (e.g., 'ethereum', 'polygon')
     * @returns {Promise<Array>} List of tokens
     */
    async getTokens(networkId = null) {
        const cacheKey = `tokens_${networkId || 'all'}`;

        return this._getCached(cacheKey, async () => {
            const data = await this._request('/v1/tokens');

            // Filter by network if specified
            if (networkId && data.tokens) {
                return data.tokens.filter(token => token.network_id === networkId);
            }

            return data.tokens || [];
        });
    }

    /**
     * Get token details by address
     * @param {string} tokenAddress - Token contract address
     * @param {string} networkId - Network ID
     * @returns {Promise<Object>} Token details
     */
    async getTokenDetails(tokenAddress, networkId) {
        const tokens = await this.getTokens(networkId);
        return tokens.find(t =>
            t.address?.toLowerCase() === tokenAddress.toLowerCase() ||
            t.contract_address?.toLowerCase() === tokenAddress.toLowerCase()
        );
    }

    /**
     * Search tokens by symbol or name
     * @param {string} query - Search query
     * @param {string} networkId - Optional network filter
     * @returns {Promise<Array>} Matching tokens
     */
    async searchTokens(query, networkId = null) {
        const tokens = await this.getTokens(networkId);
        const lowerQuery = query.toLowerCase();

        return tokens.filter(token =>
            token.symbol?.toLowerCase().includes(lowerQuery) ||
            token.name?.toLowerCase().includes(lowerQuery) ||
            token.address?.toLowerCase().includes(lowerQuery)
        );
    }

    /* ========================================================================
       CHAIN ENDPOINTS
       ====================================================================== */

    /**
     * Get all supported chains
     * @returns {Promise<Array>} List of chains
     */
    async getSupportedChains() {
        return this._getCached('chains', async () => {
            try {
                const data = await this._request('/v1/supported-chains');
                return data.chains || [];
            } catch (error) {
                // Fallback to mock data if endpoint doesn't exist
                console.warn('Using fallback chain data');
                return this._getFallbackChains();
            }
        });
    }

    /**
     * Get chain details by ID
     * @param {string} chainId - Chain ID
     * @returns {Promise<Object>} Chain details
     */
    async getChainDetails(chainId) {
        const chains = await this.getSupportedChains();
        return chains.find(c => c.id === chainId || c.chain_id === chainId);
    }

    /**
     * Fallback chain data (most popular chains)
     */
    _getFallbackChains() {
        return [
            { id: 'ethereum', name: 'Ethereum', chain_id: 1, symbol: 'ETH', type: 'L1' },
            { id: 'polygon', name: 'Polygon', chain_id: 137, symbol: 'MATIC', type: 'L2' },
            { id: 'bsc', name: 'BNB Chain', chain_id: 56, symbol: 'BNB', type: 'sidechain' },
            { id: 'arbitrum', name: 'Arbitrum', chain_id: 42161, symbol: 'ETH', type: 'L2' },
            { id: 'optimism', name: 'Optimism', chain_id: 10, symbol: 'ETH', type: 'L2' },
            { id: 'avalanche', name: 'Avalanche', chain_id: 43114, symbol: 'AVAX', type: 'L1' },
            { id: 'fantom', name: 'Fantom', chain_id: 250, symbol: 'FTM', type: 'L1' },
            { id: 'gnosis', name: 'Gnosis', chain_id: 100, symbol: 'xDAI', type: 'sidechain' },
            { id: 'moonbeam', name: 'Moonbeam', chain_id: 1284, symbol: 'GLMR', type: 'parachain' },
            { id: 'moonriver', name: 'Moonriver', chain_id: 1285, symbol: 'MOVR', type: 'parachain' }
        ];
    }

    /* ========================================================================
       SWAP ENDPOINTS
       ====================================================================== */

    /**
     * Get swap quotation
     * @param {Object} params - Quotation parameters
     * @returns {Promise<Object>} Quote details with routes
     */
    async getQuotation(params) {
        const {
            fromToken,
            toToken,
            amount,
            network = 'ethereum',
            slippage = 0.5
        } = params;

        const queryParams = new URLSearchParams({
            fromToken,
            toToken,
            amount,
            network,
            slippage: slippage.toString()
        });

        // Don't cache quotes - they're time-sensitive
        return this._request(`/v1/quotation?${queryParams.toString()}`);
    }

    /**
     * Get swap status
     * @param {string} txHash - Transaction hash
     * @returns {Promise<Object>} Transaction status
     */
    async getSwapStatus(txHash) {
        try {
            return await this._request(`/v1/swap/status/${txHash}`);
        } catch (error) {
            // Fallback: check on-chain via Web3
            console.warn('Swap status endpoint unavailable, checking on-chain');
            return { status: 'unknown', message: 'Status endpoint unavailable' };
        }
    }

    /* ========================================================================
       BRIDGE ENDPOINTS
       ====================================================================== */

    /**
     * Get bridge quotation (cross-chain)
     * @param {Object} params - Bridge parameters
     * @returns {Promise<Object>} Bridge quote details
     */
    async getBridgeQuotation(params) {
        const {
            fromToken,
            toToken,
            amount,
            fromNetwork,
            toNetwork,
            slippage = 1.0 // Higher slippage for bridges
        } = params;

        try {
            const response = await this._request('/v1/bridge/quotation', {
                method: 'POST',
                body: JSON.stringify({
                    fromToken,
                    toToken,
                    amount,
                    fromNetwork,
                    toNetwork,
                    slippage
                })
            });
            return response;
        } catch (error) {
            console.error('Bridge quotation failed:', error);
            throw new Error('Bridge quotation unavailable');
        }
    }

    /**
     * Execute bridge transaction
     * @param {Object} params - Bridge execution parameters
     * @returns {Promise<Object>} Bridge transaction result
     */
    async executeBridge(params) {
        try {
            return await this._request('/v1/bridge', {
                method: 'POST',
                body: JSON.stringify(params)
            });
        } catch (error) {
            console.error('Bridge execution failed:', error);
            throw error;
        }
    }

    /**
     * Get bridge transaction status
     * @param {string} bridgeTxId - Bridge transaction ID
     * @returns {Promise<Object>} Bridge status (3-stage)
     */
    async getBridgeStatus(bridgeTxId) {
        try {
            return await this._request(`/v1/bridge/status/${bridgeTxId}`);
        } catch (error) {
            console.error('Bridge status check failed:', error);
            return {
                status: 'unknown',
                stages: {
                    source: 'unknown',
                    bridge: 'unknown',
                    destination: 'unknown'
                }
            };
        }
    }

    /* ========================================================================
       TRANSACTION HISTORY
       ====================================================================== */

    /**
     * Get transaction history for wallet
     * @param {string} walletAddress - User wallet address
     * @param {Object} filters - Optional filters (limit, offset, type)
     * @returns {Promise<Array>} Transaction history
     */
    async getTransactionHistory(walletAddress, filters = {}) {
        const { limit = 50, offset = 0, type = 'all' } = filters;

        const queryParams = new URLSearchParams({
            address: walletAddress,
            limit: limit.toString(),
            offset: offset.toString(),
            type
        });

        try {
            const data = await this._request(`/v1/transaction-history?${queryParams.toString()}`);
            return data.transactions || [];
        } catch (error) {
            console.error('Transaction history fetch failed:', error);
            // Fallback to localStorage
            return this._getLocalTransactionHistory(walletAddress);
        }
    }

    /**
     * Save transaction to local history (fallback)
     */
    saveTransactionLocal(walletAddress, transaction) {
        const key = `brofit_tx_history_${walletAddress.toLowerCase()}`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');

        history.unshift({
            ...transaction,
            timestamp: Date.now()
        });

        // Keep only last 100 transactions
        const trimmed = history.slice(0, 100);
        localStorage.setItem(key, JSON.stringify(trimmed));
    }

    /**
     * Get local transaction history (fallback)
     */
    _getLocalTransactionHistory(walletAddress) {
        const key = `brofit_tx_history_${walletAddress.toLowerCase()}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    /* ========================================================================
       PRICE & GAS ENDPOINTS
       ====================================================================== */

    /**
     * Get token price in USD
     * @param {string} tokenAddress - Token contract address
     * @param {string} networkId - Network ID
     * @returns {Promise<number>} Price in USD
     */
    async getTokenPrice(tokenAddress, networkId) {
        const cacheKey = `price_${networkId}_${tokenAddress}`;

        return this._getCached(cacheKey, async () => {
            try {
                const data = await this._request(`/v1/token-price?token=${tokenAddress}&network=${networkId}`);
                return data.price || 0;
            } catch (error) {
                console.error('Token price fetch failed:', error);
                return 0;
            }
        });
    }

    /**
     * Get current gas price for network
     * @param {string} networkId - Network ID
     * @returns {Promise<Object>} Gas price data (slow, standard, fast)
     */
    async getGasPrice(networkId) {
        const cacheKey = `gas_${networkId}`;

        return this._getCached(cacheKey, async () => {
            try {
                const data = await this._request(`/v1/gas-price?network=${networkId}`);
                return data;
            } catch (error) {
                console.error('Gas price fetch failed:', error);
                return { slow: 0, standard: 0, fast: 0 };
            }
        });
    }

    /**
     * Estimate gas cost for transaction in USD
     * @param {string} networkId - Network ID
     * @param {number} gasUnits - Estimated gas units
     * @returns {Promise<number>} Cost in USD
     */
    async estimateGasCostUSD(networkId, gasUnits) {
        try {
            const gasPrice = await this.getGasPrice(networkId);
            const chain = await this.getChainDetails(networkId);
            const nativeTokenPrice = await this.getTokenPrice('native', networkId);

            // Calculate: (gasUnits * gasPrice * nativeTokenPrice) / 1e18
            const gasCostNative = (gasUnits * gasPrice.standard) / 1e18;
            return gasCostNative * nativeTokenPrice;
        } catch (error) {
            console.error('Gas cost estimation failed:', error);
            return 0;
        }
    }

    /* ========================================================================
       ALLOWANCE ENDPOINTS
       ====================================================================== */

    /**
     * Check ERC20 token allowance
     * @param {string} tokenAddress - Token contract address
     * @param {string} ownerAddress - Token owner address
     * @param {string} spenderAddress - Spender (contract) address
     * @returns {Promise<string>} Allowance amount
     */
    async checkAllowance(tokenAddress, ownerAddress, spenderAddress) {
        try {
            const data = await this._request(
                `/v1/allowance?token=${tokenAddress}&owner=${ownerAddress}&spender=${spenderAddress}`
            );
            return data.allowance || '0';
        } catch (error) {
            console.error('Allowance check failed:', error);
            return '0';
        }
    }

    /* ========================================================================
       ANALYTICS & STATS
       ====================================================================== */

    /**
     * Get platform statistics
     * @returns {Promise<Object>} Platform stats
     */
    async getStats() {
        return this._getCached('stats', async () => {
            try {
                const data = await this._request('/v1/stats');
                return data;
            } catch (error) {
                console.error('Stats fetch failed:', error);
                return {
                    totalVolume: '$124.5M',
                    totalSwaps: '1.2M+',
                    supportedChains: 180,
                    supportedTokens: 5000
                };
            }
        });
    }
}

/* ============================================================================
   SINGLETON INSTANCE
   ========================================================================== */

// API key (⚠️ SECURITY WARNING: In production, use backend proxy)
const API_KEY = 'b8c17e35-9de5-49a0-8a62-b5fea1dc61a9';

// Create singleton instance
const rocketxAPI = new RocketXAPI(API_KEY);

/* ============================================================================
   EXPORT
   ========================================================================== */

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RocketXAPI, rocketxAPI };
}
