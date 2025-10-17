/**
 * BroFit Moralis API Integration
 * Multi-chain portfolio tracking and token data
 *
 * API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * Base URL: https://deep-index.moralis.io/api/v2.2
 */

/* ============================================================================
   CONFIGURATION
   ========================================================================== */

const MORALIS_CONFIG = {
    API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjM3MmE3NmNkLTRkZmYtNGI2OC05NTRiLWQwNWZiZTlmNTgzYyIsIm9yZ0lkIjoiNDQ3MzE4IiwidXNlcklkIjoiNDYwMjM2IiwidHlwZUlkIjoiYjFjY2Y1OWUtN2M3Mi00YjdlLWJkNTEtMjQzNmRmZDg2OTc2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDczNTM2MDMsImV4cCI6NDkwMzExMzYwM30.d03rGvyBobwlLHYpGJcnnd3nAmWsBUfwZyIpeM-xSSQ',
    BASE_URL: 'https://deep-index.moralis.io/api/v2.2',

    // Supported chains with their identifiers
    CHAINS: {
        'ethereum': { id: 'eth', name: 'Ethereum', moralisId: '0x1' },
        'eth': { id: 'eth', name: 'Ethereum', moralisId: '0x1' },
        'polygon': { id: 'polygon', name: 'Polygon', moralisId: '0x89' },
        'matic': { id: 'polygon', name: 'Polygon', moralisId: '0x89' },
        'bsc': { id: 'bsc', name: 'BNB Chain', moralisId: '0x38' },
        'binance': { id: 'bsc', name: 'BNB Chain', moralisId: '0x38' },
        'arbitrum': { id: 'arbitrum', name: 'Arbitrum', moralisId: '0xa4b1' },
        'optimism': { id: 'optimism', name: 'Optimism', moralisId: '0xa' },
        'avalanche': { id: 'avalanche', name: 'Avalanche', moralisId: '0xa86a' },
        'avax': { id: 'avalanche', name: 'Avalanche', moralisId: '0xa86a' },
        'fantom': { id: 'fantom', name: 'Fantom', moralisId: '0xfa' },
        'ftm': { id: 'fantom', name: 'Fantom', moralisId: '0xfa' }
    },

    // Cache settings
    CACHE_PREFIX: 'brofit_moralis_',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    BALANCE_CACHE_DURATION: 30 * 1000 // 30 seconds for balances
};

/* ============================================================================
   CACHE MANAGEMENT
   ========================================================================== */

function getCachedData(key, maxAge) {
    try {
        const cached = localStorage.getItem(MORALIS_CONFIG.CACHE_PREFIX + key);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        if (age < maxAge) {
            return data.value;
        }

        localStorage.removeItem(MORALIS_CONFIG.CACHE_PREFIX + key);
        return null;
    } catch (error) {
        console.warn('Moralis cache read error:', error);
        return null;
    }
}

function cacheData(key, value) {
    try {
        const data = {
            value: value,
            timestamp: Date.now()
        };
        localStorage.setItem(MORALIS_CONFIG.CACHE_PREFIX + key, JSON.stringify(data));
    } catch (error) {
        console.warn('Moralis cache write error:', error);
    }
}

/* ============================================================================
   API REQUEST WRAPPER
   ========================================================================== */

async function moralisRequest(endpoint, params = {}) {
    const url = new URL(`${MORALIS_CONFIG.BASE_URL}${endpoint}`);

    // Add all params to URL
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': MORALIS_CONFIG.API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Moralis API request failed:', error);
        throw error;
    }
}

/* ============================================================================
   WALLET TOKENS
   ========================================================================== */

/**
 * Get all ERC20 tokens owned by an address
 */
async function getWalletTokens(address, chain = 'eth') {
    if (!address) throw new Error('Address is required');

    const cacheKey = `tokens_${chain}_${address.toLowerCase()}`;
    const cached = getCachedData(cacheKey, MORALIS_CONFIG.BALANCE_CACHE_DURATION);
    if (cached) return cached;

    try {
        const data = await moralisRequest(`/wallets/${address}/tokens`, {
            chain: chain
        });

        cacheData(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`Failed to get tokens for ${address} on ${chain}:`, error);
        return { result: [] };
    }
}

/**
 * Get tokens across multiple chains
 */
async function getMultiChainTokens(address, chains = null) {
    if (!address) throw new Error('Address is required');

    const chainsToQuery = chains || Object.keys(MORALIS_CONFIG.CHAINS)
        .filter((k, i, arr) => arr.indexOf(k) === i) // Remove duplicates
        .map(k => MORALIS_CONFIG.CHAINS[k].id);

    const results = [];

    for (const chain of chainsToQuery) {
        try {
            const data = await getWalletTokens(address, chain);
            const tokens = (data.result || []).map(token => ({
                ...token,
                chain: chain
            }));
            results.push(...tokens);
        } catch (error) {
            console.warn(`Failed to fetch ${chain} tokens:`, error);
            // Continue with other chains
        }
    }

    return results;
}

/* ============================================================================
   NATIVE BALANCE
   ========================================================================== */

/**
 * Get native token balance (ETH, MATIC, etc.)
 */
async function getNativeBalance(address, chain = 'eth') {
    if (!address) throw new Error('Address is required');

    const cacheKey = `native_${chain}_${address.toLowerCase()}`;
    const cached = getCachedData(cacheKey, MORALIS_CONFIG.BALANCE_CACHE_DURATION);
    if (cached) return cached;

    try {
        const data = await moralisRequest(`/${address}/balance`, {
            chain: chain
        });

        cacheData(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`Failed to get native balance for ${address} on ${chain}:`, error);
        return { balance: '0' };
    }
}

/**
 * Get native balances across multiple chains
 */
async function getMultiChainNativeBalances(address, chains = null) {
    if (!address) throw new Error('Address is required');

    const chainsToQuery = chains || Object.keys(MORALIS_CONFIG.CHAINS)
        .filter((k, i, arr) => arr.indexOf(k) === i)
        .map(k => MORALIS_CONFIG.CHAINS[k].id);

    const results = {};

    for (const chain of chainsToQuery) {
        try {
            const balance = await getNativeBalance(address, chain);
            results[chain] = balance;
        } catch (error) {
            console.warn(`Failed to fetch ${chain} native balance:`, error);
            results[chain] = { balance: '0' };
        }
    }

    return results;
}

/* ============================================================================
   TOKEN METADATA
   ========================================================================== */

/**
 * Get token metadata by contract address
 */
async function getTokenMetadata(addresses, chain = 'eth') {
    if (!addresses || addresses.length === 0) return [];

    const addressList = Array.isArray(addresses) ? addresses : [addresses];
    const cacheKey = `metadata_${chain}_${addressList.join('_')}`;
    const cached = getCachedData(cacheKey, MORALIS_CONFIG.CACHE_DURATION);
    if (cached) return cached;

    try {
        const data = await moralisRequest(`/erc20/metadata`, {
            chain: chain,
            addresses: addressList.join(',')
        });

        cacheData(cacheKey, data);
        return Array.isArray(data) ? data : [data];
    } catch (error) {
        console.error('Failed to get token metadata:', error);
        return [];
    }
}

/* ============================================================================
   TOKEN PRICES
   ========================================================================== */

/**
 * Get token price by contract address
 */
async function getTokenPrice(address, chain = 'eth') {
    if (!address) throw new Error('Address is required');

    const cacheKey = `price_${chain}_${address.toLowerCase()}`;
    const cached = getCachedData(cacheKey, MORALIS_CONFIG.CACHE_DURATION);
    if (cached) return cached;

    try {
        const data = await moralisRequest(`/erc20/${address}/price`, {
            chain: chain
        });

        cacheData(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`Failed to get price for ${address}:`, error);
        return null;
    }
}

/**
 * Get prices for multiple tokens
 */
async function getMultipleTokenPrices(tokens) {
    const results = {};

    for (const token of tokens) {
        const { address, chain } = token;
        try {
            const price = await getTokenPrice(address, chain);
            const key = `${chain}_${address}`;
            results[key] = price;
        } catch (error) {
            console.warn(`Failed to get price for ${address} on ${chain}:`, error);
        }
    }

    return results;
}

/* ============================================================================
   NFTs (OPTIONAL)
   ========================================================================== */

/**
 * Get NFTs owned by an address
 */
async function getWalletNFTs(address, chain = 'eth') {
    if (!address) throw new Error('Address is required');

    const cacheKey = `nfts_${chain}_${address.toLowerCase()}`;
    const cached = getCachedData(cacheKey, MORALIS_CONFIG.CACHE_DURATION);
    if (cached) return cached;

    try {
        const data = await moralisRequest(`/${address}/nft`, {
            chain: chain,
            format: 'decimal',
            limit: 100
        });

        cacheData(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`Failed to get NFTs for ${address}:`, error);
        return { result: [] };
    }
}

/* ============================================================================
   TRANSACTION HISTORY
   ========================================================================== */

/**
 * Get transaction history for an address
 */
async function getWalletTransactions(address, chain = 'eth', limit = 25) {
    if (!address) throw new Error('Address is required');

    const cacheKey = `txs_${chain}_${address.toLowerCase()}_${limit}`;
    const cached = getCachedData(cacheKey, MORALIS_CONFIG.CACHE_DURATION);
    if (cached) return cached;

    try {
        const data = await moralisRequest(`/${address}`, {
            chain: chain,
            limit: limit
        });

        cacheData(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`Failed to get transactions for ${address}:`, error);
        return { result: [] };
    }
}

/**
 * Get ERC20 token transfers for an address
 */
async function getTokenTransfers(address, chain = 'eth', limit = 25) {
    if (!address) throw new Error('Address is required');

    const cacheKey = `transfers_${chain}_${address.toLowerCase()}_${limit}`;
    const cached = getCachedData(cacheKey, MORALIS_CONFIG.CACHE_DURATION);
    if (cached) return cached;

    try {
        const data = await moralisRequest(`/${address}/erc20/transfers`, {
            chain: chain,
            limit: limit
        });

        cacheData(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`Failed to get token transfers for ${address}:`, error);
        return { result: [] };
    }
}

/* ============================================================================
   HIGH-LEVEL HELPER FUNCTIONS
   ========================================================================== */

/**
 * Get complete portfolio for an address across all chains
 */
async function getCompletePortfolio(address) {
    try {
        // Fetch tokens from all supported chains
        const tokens = await getMultiChainTokens(address);

        // Fetch native balances
        const nativeBalances = await getMultiChainNativeBalances(address);

        // Combine and format
        const portfolio = {
            address: address,
            timestamp: Date.now(),
            tokens: tokens.filter(t => parseFloat(t.balance_formatted || 0) > 0),
            nativeBalances: nativeBalances,
            totalValue: 0,
            chainBreakdown: {}
        };

        // Calculate totals
        portfolio.tokens.forEach(token => {
            const value = parseFloat(token.usd_value || 0);
            portfolio.totalValue += value;

            if (!portfolio.chainBreakdown[token.chain]) {
                portfolio.chainBreakdown[token.chain] = 0;
            }
            portfolio.chainBreakdown[token.chain] += value;
        });

        return portfolio;
    } catch (error) {
        console.error('Failed to get complete portfolio:', error);
        throw error;
    }
}

/**
 * Get portfolio summary (lightweight version)
 */
async function getPortfolioSummary(address, topN = 5) {
    try {
        const portfolio = await getCompletePortfolio(address);

        // Sort tokens by value
        const sortedTokens = portfolio.tokens
            .sort((a, b) => parseFloat(b.usd_value || 0) - parseFloat(a.usd_value || 0));

        return {
            address: address,
            totalValue: portfolio.totalValue,
            tokenCount: portfolio.tokens.length,
            chainCount: Object.keys(portfolio.chainBreakdown).length,
            topTokens: sortedTokens.slice(0, topN),
            chainBreakdown: portfolio.chainBreakdown
        };
    } catch (error) {
        console.error('Failed to get portfolio summary:', error);
        throw error;
    }
}

/* ============================================================================
   CACHE UTILITIES
   ========================================================================== */

/**
 * Clear Moralis cache
 */
function clearMoralisCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith(MORALIS_CONFIG.CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
    console.log('Moralis cache cleared');
}

/**
 * Get cache statistics
 */
function getMoralisCacheStats() {
    const keys = Object.keys(localStorage);
    const moralisKeys = keys.filter(k => k.startsWith(MORALIS_CONFIG.CACHE_PREFIX));

    let valid = 0;
    let expired = 0;

    moralisKeys.forEach(key => {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            const age = Date.now() - data.timestamp;
            if (age < MORALIS_CONFIG.CACHE_DURATION) {
                valid++;
            } else {
                expired++;
            }
        } catch (error) {
            // Ignore parsing errors
        }
    });

    return {
        total: moralisKeys.length,
        valid,
        expired,
        cacheHitRate: moralisKeys.length > 0 ? (valid / moralisKeys.length * 100).toFixed(2) + '%' : '0%'
    };
}

/* ============================================================================
   EXPORTS
   ========================================================================== */

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Configuration
        MORALIS_CONFIG,

        // Wallet tokens
        getWalletTokens,
        getMultiChainTokens,

        // Native balances
        getNativeBalance,
        getMultiChainNativeBalances,

        // Token metadata
        getTokenMetadata,

        // Token prices
        getTokenPrice,
        getMultipleTokenPrices,

        // NFTs
        getWalletNFTs,

        // Transactions
        getWalletTransactions,
        getTokenTransfers,

        // High-level helpers
        getCompletePortfolio,
        getPortfolioSummary,

        // Cache
        clearMoralisCache,
        getMoralisCacheStats
    };
}

// Browser global exposure (for <script> tag usage)
if (typeof window !== 'undefined') {
    // Configuration
    window.MORALIS_CONFIG = MORALIS_CONFIG;

    // Wallet tokens
    window.getWalletTokens = getWalletTokens;
    window.getMultiChainTokens = getMultiChainTokens;

    // Native balances
    window.getNativeBalance = getNativeBalance;
    window.getMultiChainNativeBalances = getMultiChainNativeBalances;

    // Token metadata
    window.getTokenMetadata = getTokenMetadata;

    // Token prices
    window.getTokenPrice = getTokenPrice;
    window.getMultipleTokenPrices = getMultipleTokenPrices;

    // NFTs
    window.getWalletNFTs = getWalletNFTs;

    // Transactions
    window.getWalletTransactions = getWalletTransactions;
    window.getTokenTransfers = getTokenTransfers;

    // High-level helpers
    window.getCompletePortfolio = getCompletePortfolio;
    window.getPortfolioSummary = getPortfolioSummary;

    // Cache
    window.clearMoralisCache = clearMoralisCache;
    window.getMoralisCacheStats = getMoralisCacheStats;

    console.log('✅ Moralis API loaded and globally accessible');
}
