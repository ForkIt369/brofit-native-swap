/**
 * BroFit CoinGecko API Integration
 * Token metadata, prices, and icon URLs
 *
 * API Key: CG-W6Sr7Nw6HLqTGC1s2LEFLKZw
 * Plan: Demo API
 */

/* ============================================================================
   CONFIGURATION
   ========================================================================== */

const COINGECKO_CONFIG = {
    // ✅ API key removed! All requests now go through secure backend at /api/coingecko/*
    // Legacy functions (getCoinData, searchCoin) should migrate to backend proxy as well
    BASE_URL: 'https://api.coingecko.com/api/v3',
    CACHE_PREFIX: 'brofit_cg_',
    CACHE_DURATION: 10 * 60 * 1000, // 10 minutes for price data (increased from 5)
    METADATA_CACHE_DURATION: 48 * 60 * 60 * 1000, // 48 hours for metadata (increased from 24)

    // Rate limiting (Demo API plan)
    RATE_LIMIT: {
        requestsPerMinute: 30,
        requestsPerMonth: 10000
    }
};

/* ============================================================================
   RATE LIMITING
   ========================================================================== */

class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }

    async waitIfNeeded() {
        const now = Date.now();
        // Remove requests outside the window
        this.requests = this.requests.filter(time => now - time < this.windowMs);

        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = this.requests[0];
            const waitTime = this.windowMs - (now - oldestRequest);
            console.log(`Rate limit reached. Waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.waitIfNeeded();
        }

        this.requests.push(now);
    }
}

const rateLimiter = new RateLimiter(
    COINGECKO_CONFIG.RATE_LIMIT.requestsPerMinute,
    60 * 1000 // 1 minute
);

/* ============================================================================
   CACHE MANAGEMENT
   ========================================================================== */

function getCachedData(key, maxAge) {
    try {
        const cached = localStorage.getItem(COINGECKO_CONFIG.CACHE_PREFIX + key);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        if (age < maxAge) {
            return data.value;
        }

        localStorage.removeItem(COINGECKO_CONFIG.CACHE_PREFIX + key);
        return null;
    } catch (error) {
        console.warn('Cache read error:', error);
        return null;
    }
}

function cacheData(key, value, maxAge) {
    try {
        const data = {
            value: value,
            timestamp: Date.now(),
            maxAge: maxAge
        };
        localStorage.setItem(COINGECKO_CONFIG.CACHE_PREFIX + key, JSON.stringify(data));
    } catch (error) {
        console.warn('Cache write error:', error);
    }
}

/* ============================================================================
   API REQUEST WRAPPER
   ========================================================================== */

async function coinGeckoRequest(endpoint, params = {}) {
    // ⚠️ DEPRECATED: Direct API calls are disabled for security
    // All CoinGecko requests should now go through /api/coingecko/* backend proxy
    throw new Error('Direct CoinGecko API calls are deprecated. Use backend proxy at /api/coingecko/* instead.');

    await rateLimiter.waitIfNeeded();

    const url = new URL(`${COINGECKO_CONFIG.BASE_URL}${endpoint}`);

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
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limit exceeded');
            }
            throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('CoinGecko API request failed:', error);
        throw error;
    }
}

/* ============================================================================
   COIN LIST & SEARCH
   ========================================================================== */

/**
 * Get full list of all coins with ID, symbol, name
 * Cached for 24 hours
 */
async function getCoinsList() {
    const cacheKey = 'coins_list';
    const cached = getCachedData(cacheKey, COINGECKO_CONFIG.METADATA_CACHE_DURATION);
    if (cached) return cached;

    const data = await coinGeckoRequest('/coins/list', {
        include_platform: true
    });

    cacheData(cacheKey, data, COINGECKO_CONFIG.METADATA_CACHE_DURATION);
    return data;
}

/**
 * Search for coin by symbol
 */
async function searchCoinBySymbol(symbol) {
    if (!symbol) return null;

    const cacheKey = `search_${symbol.toLowerCase()}`;
    const cached = getCachedData(cacheKey, COINGECKO_CONFIG.METADATA_CACHE_DURATION);
    if (cached) return cached;

    try {
        const coinsList = await getCoinsList();
        const matches = coinsList.filter(coin =>
            coin.symbol.toLowerCase() === symbol.toLowerCase()
        );

        // Prefer coins with more platforms (more established)
        const result = matches.sort((a, b) => {
            const aPlatforms = Object.keys(a.platforms || {}).length;
            const bPlatforms = Object.keys(b.platforms || {}).length;
            return bPlatforms - aPlatforms;
        })[0] || null;

        cacheData(cacheKey, result, COINGECKO_CONFIG.METADATA_CACHE_DURATION);
        return result;
    } catch (error) {
        console.error('Coin search failed:', error);
        return null;
    }
}

/**
 * Search for coin by contract address
 */
async function searchCoinByAddress(contractAddress, platform = 'ethereum') {
    if (!contractAddress) return null;

    const cacheKey = `address_${platform}_${contractAddress.toLowerCase()}`;
    const cached = getCachedData(cacheKey, COINGECKO_CONFIG.METADATA_CACHE_DURATION);
    if (cached) return cached;

    try {
        const coinsList = await getCoinsList();
        const result = coinsList.find(coin => {
            if (!coin.platforms) return false;
            const address = coin.platforms[platform];
            return address && address.toLowerCase() === contractAddress.toLowerCase();
        }) || null;

        cacheData(cacheKey, result, COINGECKO_CONFIG.METADATA_CACHE_DURATION);
        return result;
    } catch (error) {
        console.error('Coin search by address failed:', error);
        return null;
    }
}

/* ============================================================================
   COIN DATA
   ========================================================================== */

/**
 * Get detailed coin data including logo
 */
async function getCoinData(coinId) {
    if (!coinId) return null;

    const cacheKey = `coin_${coinId}`;
    const cached = getCachedData(cacheKey, COINGECKO_CONFIG.METADATA_CACHE_DURATION);
    if (cached) return cached;

    try {
        const data = await coinGeckoRequest(`/coins/${coinId}`, {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false
        });

        cacheData(cacheKey, data, COINGECKO_CONFIG.METADATA_CACHE_DURATION);
        return data;
    } catch (error) {
        console.error('Get coin data failed:', error);
        return null;
    }
}

/**
 * Get coin logo URL from coin data
 */
async function getCoinLogo(coinId, size = 'small') {
    try {
        const coinData = await getCoinData(coinId);
        if (!coinData || !coinData.image) return null;

        // Available sizes: thumb (32px), small (64px), large (200px)
        return coinData.image[size] || coinData.image.small;
    } catch (error) {
        console.error('Get coin logo failed:', error);
        return null;
    }
}

/* ============================================================================
   PRICE DATA
   ========================================================================== */

/**
 * Get simple price for coin(s)
 * Now calls our secure backend API proxy (no API key needed!)
 */
async function getSimplePrice(coinIds, vsCurrencies = ['usd']) {
    if (!coinIds || coinIds.length === 0) return {};

    const cacheKey = `price_${coinIds.join(',')}_${vsCurrencies.join(',')}`;
    const cached = getCachedData(cacheKey, COINGECKO_CONFIG.CACHE_DURATION);
    if (cached) return cached;

    try {
        // Call backend API proxy instead of CoinGecko directly
        const ids = Array.isArray(coinIds) ? coinIds.join(',') : coinIds;
        const currencies = Array.isArray(vsCurrencies) ? vsCurrencies.join(',') : vsCurrencies;

        const response = await fetch(`/api/coingecko/simple/price?ids=${ids}&vs_currencies=${currencies}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
                // No API key needed - backend handles authentication!
            }
        });

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        cacheData(cacheKey, data, COINGECKO_CONFIG.CACHE_DURATION);
        return data;
    } catch (error) {
        console.error('Get simple price failed:', error);
        return {};
    }
}

/**
 * Get token price by contract address
 */
async function getTokenPrice(contractAddress, platform = 'ethereum') {
    if (!contractAddress) return null;

    const cacheKey = `token_price_${platform}_${contractAddress.toLowerCase()}`;
    const cached = getCachedData(cacheKey, COINGECKO_CONFIG.CACHE_DURATION);
    if (cached) return cached;

    try {
        const data = await coinGeckoRequest(`/simple/token_price/${platform}`, {
            contract_addresses: contractAddress,
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_market_cap: true
        });

        const result = data[contractAddress.toLowerCase()] || null;
        cacheData(cacheKey, result, COINGECKO_CONFIG.CACHE_DURATION);
        return result;
    } catch (error) {
        console.error('Get token price failed:', error);
        return null;
    }
}

/* ============================================================================
   HIGH-LEVEL HELPER FUNCTIONS
   ========================================================================== */

/**
 * Get complete token information by symbol
 * Includes logo, price, market data
 */
async function getTokenInfo(symbol) {
    try {
        // Find coin by symbol
        const coin = await searchCoinBySymbol(symbol);
        if (!coin) return null;

        // Get full coin data
        const coinData = await getCoinData(coin.id);
        if (!coinData) return null;

        // Extract relevant data
        return {
            id: coinData.id,
            symbol: coinData.symbol,
            name: coinData.name,
            image: {
                thumb: coinData.image?.thumb,
                small: coinData.image?.small,
                large: coinData.image?.large
            },
            marketData: coinData.market_data ? {
                currentPrice: coinData.market_data.current_price?.usd,
                marketCap: coinData.market_data.market_cap?.usd,
                priceChange24h: coinData.market_data.price_change_percentage_24h,
                totalVolume: coinData.market_data.total_volume?.usd,
                circulatingSupply: coinData.market_data.circulating_supply
            } : null,
            platforms: coinData.platforms || {}
        };
    } catch (error) {
        console.error('Get token info failed:', error);
        return null;
    }
}

/**
 * Get token information by contract address
 */
async function getTokenInfoByAddress(contractAddress, platform = 'ethereum') {
    try {
        // Find coin by address
        const coin = await searchCoinByAddress(contractAddress, platform);
        if (!coin) return null;

        // Get full coin data
        const coinData = await getCoinData(coin.id);
        if (!coinData) return null;

        return {
            id: coinData.id,
            symbol: coinData.symbol,
            name: coinData.name,
            image: {
                thumb: coinData.image?.thumb,
                small: coinData.image?.small,
                large: coinData.image?.large
            },
            marketData: coinData.market_data ? {
                currentPrice: coinData.market_data.current_price?.usd,
                marketCap: coinData.market_data.market_cap?.usd,
                priceChange24h: coinData.market_data.price_change_percentage_24h,
                totalVolume: coinData.market_data.total_volume?.usd,
                circulatingSupply: coinData.market_data.circulating_supply
            } : null,
            platforms: coinData.platforms || {}
        };
    } catch (error) {
        console.error('Get token info by address failed:', error);
        return null;
    }
}

/**
 * Batch get token logos for multiple tokens
 */
async function batchGetTokenLogos(tokens) {
    const results = {};

    for (const token of tokens) {
        const { symbol, address, blockchain } = token;
        const key = `${blockchain}_${address || symbol}`;

        try {
            let logo = null;

            // Try by address first
            if (address && blockchain) {
                const platform = blockchain === 'bsc' ? 'binance-smart-chain' : blockchain;
                const coin = await searchCoinByAddress(address, platform);
                if (coin) {
                    logo = await getCoinLogo(coin.id);
                }
            }

            // Fallback to symbol search
            if (!logo && symbol) {
                const coin = await searchCoinBySymbol(symbol);
                if (coin) {
                    logo = await getCoinLogo(coin.id);
                }
            }

            if (logo) {
                results[key] = logo;
            }
        } catch (error) {
            console.warn(`Failed to get logo for ${key}:`, error);
        }
    }

    return results;
}

/* ============================================================================
   CACHE UTILITIES
   ========================================================================== */

/**
 * Clear CoinGecko cache
 */
function clearCoinGeckoCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith(COINGECKO_CONFIG.CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
    console.log('CoinGecko cache cleared');
}

/**
 * Get cache statistics
 */
function getCoinGeckoCacheStats() {
    const keys = Object.keys(localStorage);
    const cgKeys = keys.filter(k => k.startsWith(COINGECKO_CONFIG.CACHE_PREFIX));

    let valid = 0;
    let expired = 0;

    cgKeys.forEach(key => {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            const age = Date.now() - data.timestamp;
            if (age < data.maxAge) {
                valid++;
            } else {
                expired++;
            }
        } catch (error) {
            // Ignore parsing errors
        }
    });

    return {
        total: cgKeys.length,
        valid,
        expired,
        cacheHitRate: cgKeys.length > 0 ? (valid / cgKeys.length * 100).toFixed(2) + '%' : '0%'
    };
}

/* ============================================================================
   EXPORTS
   ========================================================================== */

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Search
        getCoinsList,
        searchCoinBySymbol,
        searchCoinByAddress,

        // Data
        getCoinData,
        getCoinLogo,

        // Prices
        getSimplePrice,
        getTokenPrice,

        // High-level helpers
        getTokenInfo,
        getTokenInfoByAddress,
        batchGetTokenLogos,

        // Cache
        clearCoinGeckoCache,
        getCoinGeckoCacheStats
    };
}

// Browser global exposure (for <script> tag usage)
if (typeof window !== 'undefined') {
    // Configuration
    window.COINGECKO_CONFIG = COINGECKO_CONFIG;

    // Search
    window.getCoinsList = getCoinsList;
    window.searchCoinBySymbol = searchCoinBySymbol;
    window.searchCoinByAddress = searchCoinByAddress;

    // Coin data
    window.getCoinData = getCoinData;
    window.getCoinLogo = getCoinLogo;

    // Prices
    window.getSimplePrice = getSimplePrice;
    window.getTokenPrice_CoinGecko = getTokenPrice;

    // High-level helpers
    window.getTokenInfo = getTokenInfo;
    window.getTokenInfoByAddress = getTokenInfoByAddress;
    window.batchGetTokenLogos = batchGetTokenLogos;

    // Cache
    window.clearCoinGeckoCache = clearCoinGeckoCache;
    window.getCoinGeckoCacheStats = getCoinGeckoCacheStats;

    console.log('✅ CoinGecko API loaded and globally accessible');
}
