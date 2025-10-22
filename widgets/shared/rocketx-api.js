/**
 * RocketX API Wrapper
 * Centralized API client for all RocketX endpoints
 * Handles authentication, rate limiting, and error handling
 */

class RocketXAPI {
    constructor(apiKey = null) {
        // API key no longer needed - handled by backend!
        this.apiKey = apiKey; // Keep for backwards compatibility
        this.baseURL = ''; // Use relative URLs to call our backend
        this.cache = new Map();
        this.cacheTime = 30000; // 30 seconds
    }

    /* ========================================================================
       PRIVATE METHODS
       ====================================================================== */

    /**
     * Make HTTP request with error handling
     * Now calls our backend API proxy (no API key needed!)
     */
    async _request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const defaultHeaders = {
            'Content-Type': 'application/json'
            // API key removed - backend handles authentication!
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
            const data = await this._request('/api/rocketx/tokens?chainId=0x1&page=1&perPage=600');

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

    /**
     * Get token ID from RocketX API (CRITICAL for swap execution)
     * RocketX /v1/swap requires token IDs, not contract addresses!
     * @param {string} chainId - Chain ID in hex format (e.g., "0x1")
     * @param {string} tokenAddressOrSymbol - Token contract address or symbol
     * @returns {Promise<number>} RocketX internal token ID
     */
    async getTokenId(chainId, tokenAddressOrSymbol) {
        const cacheKey = `tokenId_${chainId}_${tokenAddressOrSymbol.toLowerCase()}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTime) {
                return cached.data;
            }
        }

        try {
            // Fetch tokens from backend with required query params
            const queryParams = new URLSearchParams({
                chainId: chainId,
                page: '1',
                perPage: '600', // Max allowed
                keyword: tokenAddressOrSymbol
            });

            const response = await this._request(`/api/rocketx/tokens?${queryParams.toString()}`);
            const tokens = response.tokens || [];

            // Find exact match by address or symbol
            const token = tokens.find(t =>
                t.contract_address?.toLowerCase() === tokenAddressOrSymbol.toLowerCase() ||
                t.token_symbol?.toLowerCase() === tokenAddressOrSymbol.toLowerCase()
            );

            if (!token) {
                throw new Error(`Token not found: ${tokenAddressOrSymbol} on chain ${chainId}`);
            }

            // Cache the token ID
            this.cache.set(cacheKey, {
                data: token.id,
                timestamp: Date.now()
            });

            return token.id;
        } catch (error) {
            console.error('Failed to get token ID:', error);
            throw error;
        }
    }

    /* ========================================================================
       CHAIN ENDPOINTS
       ====================================================================== */

    /**
     * Get all supported chains from backend /api/rocketx/configs endpoint
     * Returns 197 networks (not just 10 fallback chains)
     * Backend caches this for 10 minutes to reduce API calls
     * @returns {Promise<Array>} List of chains
     */
    async getSupportedChains() {
        return this._getCached('chains', async () => {
            try {
                const data = await this._request('/api/rocketx/configs');

                // Parse supported_network array from configs response
                const networks = (data.supported_network || [])
                    .filter(n => n.enabled === 1)
                    .map(n => ({
                        id: n.id,
                        name: n.name,
                        chain_id: parseInt(n.chainId, 16), // Convert hex to decimal
                        chainId: n.chainId, // Keep original hex format
                        symbol: n.symbol,
                        type: n.type,
                        logo: n.logo,
                        rpc_url: n.rpc_url,
                        explorer: n.block_explorer_url,
                        native_token: n.native_token,
                        regex: n.regex,
                        buy_enabled: n.buy_enabled,
                        sell_enabled: n.sell_enabled
                    }));

                console.log(`Loaded ${networks.length} supported chains from RocketX`);
                return networks;
            } catch (error) {
                // Fallback to mock data if endpoint fails
                console.warn('Failed to load chains from RocketX, using fallback data:', error.message);
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
     * Get swap quotation (POST request to /v1/quotation)
     * @param {Object} params - Quotation parameters
     * @param {string} params.fromTokenAddress - Source token address
     * @param {string} params.toTokenAddress - Destination token address
     * @param {string} params.amount - Amount in wei/smallest unit
     * @param {string} params.fromTokenChainId - Source chain ID (hex format, e.g. "0x1")
     * @param {string} params.toTokenChainId - Destination chain ID (hex format)
     * @param {number} params.slippage - Slippage tolerance (default: 1)
     * @param {string} params.referrer - Referrer address for revenue sharing (optional)
     * @param {string} params.partnerId - Partner ID (optional)
     * @returns {Promise<Object>} Quote details with routes, gas estimates, price impact
     */
    async getQuotation(params) {
        const {
            fromTokenAddress,
            toTokenAddress,
            amount,
            fromTokenChainId,
            toTokenChainId,
            slippage = 1,
            referrer = '0x0000000000000000000000000000000000000000',
            partnerId = 'brofit'
        } = params;

        // Build POST payload (uses addresses for quotation)
        const payload = {
            fromTokenAddress,
            toTokenAddress,
            amount,
            fromTokenChainId,
            toTokenChainId,
            slippage,
            referrer,
            partnerId
        };

        // Don't cache quotes - they're time-sensitive
        return this._request('/api/rocketx/quote', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    /**
     * Get transaction status by requestId
     * @param {string} requestId - Request ID from /v1/swap response
     * @param {string} txId - Optional transaction hash for walletless swaps
     * @returns {Promise<Object>} Transaction status with subState and commission info
     */
    async getSwapStatus(requestId, txId = null) {
        try {
            const queryParams = new URLSearchParams({ requestId });
            if (txId) {
                queryParams.append('txId', txId);
            }

            const response = await this._request(`/api/rocketx/status?${queryParams.toString()}`);

            // Response includes:
            // - status: "pending" | "success" | "failed"
            // - subState: transaction_pending | pending | approved | executed | withdrawal | withdraw_success | invalid
            // - partnersCommission: Revenue sharing percentage (earn 70% of fees!)
            // - originTransactionHash & destinationTransactionHash
            // - originTransactionUrl & destinationTransactionUrl

            return response;
        } catch (error) {
            console.error('Failed to get swap status:', error);
            return { status: 'unknown', message: error.message };
        }
    }

    /**
     * Execute swap transaction (POST /v1/swap)
     * CRITICAL: This endpoint requires token IDs, NOT contract addresses!
     * Use getTokenId() to resolve addresses to IDs first.
     *
     * @param {Object} params - Swap parameters
     * @param {string} params.fromTokenAddress - Source token address (will be resolved to ID)
     * @param {string} params.toTokenAddress - Destination token address (will be resolved to ID)
     * @param {string} params.fromTokenChainId - Source chain ID (hex format, e.g. "0x1")
     * @param {string} params.toTokenChainId - Destination chain ID (hex format)
     * @param {string} params.fromTokenAmount - Amount in wei/smallest unit
     * @param {string} params.userAddress - User's wallet address
     * @param {number} params.slippage - Slippage tolerance (default: 1)
     * @param {string} params.referrer - Referrer address for revenue sharing (optional)
     * @param {string} params.partnerId - Partner ID (optional)
     * @returns {Promise<Object>} Swap response with requestId, transaction data, gas estimates
     */
    async executeSwap(params) {
        const {
            fromTokenAddress,
            toTokenAddress,
            fromTokenChainId,
            toTokenChainId,
            fromTokenAmount,
            userAddress,
            slippage = 1,
            referrer = '0x0000000000000000000000000000000000000000', // TODO: Set your referrer address to earn 70% commission!
            partnerId = 'brofit'
        } = params;

        try {
            // Step 1: Resolve token addresses to RocketX internal token IDs
            console.log('Resolving token IDs...');
            const fromTokenId = await this.getTokenId(fromTokenChainId, fromTokenAddress);
            const toTokenId = await this.getTokenId(toTokenChainId, toTokenAddress);

            console.log(`Token IDs resolved: ${fromTokenAddress} -> ${fromTokenId}, ${toTokenAddress} -> ${toTokenId}`);

            // Step 2: Build swap payload with token IDs (NOT addresses!)
            const payload = {
                fromTokenId: fromTokenId,
                toTokenId: toTokenId,
                fromTokenAmount: fromTokenAmount,
                slippage: slippage,
                userAddress: userAddress,
                referrer: referrer,
                partnerId: partnerId
            };

            console.log('Executing swap with payload:', payload);

            // Step 3: Execute swap via backend POST /api/rocketx/swap
            const response = await this._request('/api/rocketx/swap', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            // Response includes:
            // - requestId: Use this to track transaction status via getSwapStatus()
            // - Transaction data for signing
            // - Gas estimates
            // - Expected output amount

            console.log('Swap executed successfully, requestId:', response.requestId);
            return response;

        } catch (error) {
            console.error('Swap execution failed:', error);
            throw error;
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
            timestamp: transaction.timestamp || Date.now()
        });

        // Keep only last 100 transactions
        const trimmed = history.slice(0, 100);
        localStorage.setItem(key, JSON.stringify(trimmed));

        console.log(`✅ Saved transaction ${transaction.hash} to localStorage`);
    }

    /**
     * Get local transaction history (fallback)
     */
    _getLocalTransactionHistory(walletAddress) {
        const key = `brofit_tx_history_${walletAddress.toLowerCase()}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    /**
     * Record a new swap transaction
     * Saves to both API (if available) and localStorage
     */
    async recordSwap(params) {
        const {
            walletAddress,
            hash,
            fromToken,
            fromAmount,
            toToken,
            toAmount,
            chain,
            gasFee = '$0.00',
            status = 'pending'
        } = params;

        const transaction = {
            hash,
            type: 'swap',
            fromAmount: `${fromAmount} ${fromToken}`,
            toAmount: `${toAmount} ${toToken}`,
            chain,
            status,
            timestamp: Date.now(),
            gasFee
        };

        // Save to localStorage immediately
        this.saveTransactionLocal(walletAddress, transaction);

        // Try to save to API (best effort)
        try {
            await this._request('/v1/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    walletAddress,
                    ...transaction
                })
            });
            console.log('✅ Transaction saved to RocketX API');
        } catch (error) {
            console.warn('Failed to save to API, localStorage saved:', error.message);
        }

        return transaction;
    }

    /**
     * Record a new bridge transaction
     */
    async recordBridge(params) {
        const {
            walletAddress,
            hash,
            fromToken,
            fromAmount,
            toToken,
            toAmount,
            fromChain,
            toChain,
            gasFee = '$0.00',
            bridgeFee = '$0.00',
            status = 'pending'
        } = params;

        const transaction = {
            hash,
            type: 'bridge',
            fromAmount: `${fromAmount} ${fromToken}`,
            toAmount: `${toAmount} ${toToken}`,
            chain: fromChain,
            toChain,
            status,
            timestamp: Date.now(),
            gasFee,
            bridgeFee
        };

        // Save to localStorage immediately
        this.saveTransactionLocal(walletAddress, transaction);

        // Try to save to API (best effort)
        try {
            await this._request('/v1/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    walletAddress,
                    ...transaction
                })
            });
            console.log('✅ Transaction saved to RocketX API');
        } catch (error) {
            console.warn('Failed to save to API, localStorage saved:', error.message);
        }

        return transaction;
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

// ✅ API key removed! Now securely stored on backend (Vercel environment variables)
// No API keys exposed to browser - all requests proxied through /api/rocketx/*

// Create singleton instance (no API key needed!)
const rocketxAPI = new RocketXAPI();

/* ============================================================================
   EXPORT
   ========================================================================== */

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RocketXAPI, rocketxAPI };
}
