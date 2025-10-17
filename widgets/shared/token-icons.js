/**
 * BroFit Token Icon Utility
 * Multi-source token icon loader with intelligent fallbacks
 *
 * Priority Order:
 * 1. Trust Wallet Assets (primary - 50K+ tokens, free, no rate limits)
 * 2. jsDelivr CDN (secondary - 450+ major tokens)
 * 3. CoinGecko API (tertiary - comprehensive with caching)
 * 4. Placeholder Generation (fallback)
 */

/* ============================================================================
   CONFIGURATION
   ========================================================================== */

const ICON_CONFIG = {
    // Cache settings
    CACHE_PREFIX: 'brofit_icon_',
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours

    // Trust Wallet blockchain mapping
    TRUST_WALLET_CHAINS: {
        'ethereum': 'ethereum',
        'eth': 'ethereum',
        'polygon': 'polygon',
        'matic': 'polygon',
        'bsc': 'smartchain',
        'binance': 'smartchain',
        'arbitrum': 'arbitrum',
        'optimism': 'optimism',
        'avalanche': 'avalanchec',
        'avax': 'avalanchec',
        'fantom': 'fantom',
        'ftm': 'fantom',
        'solana': 'solana',
        'sol': 'solana'
    },

    // CoinGecko common token mapping
    COINGECKO_IDS: {
        'eth': 'ethereum',
        'weth': 'weth',
        'btc': 'bitcoin',
        'wbtc': 'wrapped-bitcoin',
        'usdt': 'tether',
        'usdc': 'usd-coin',
        'dai': 'dai',
        'matic': 'matic-network',
        'bnb': 'binancecoin',
        'link': 'chainlink',
        'uni': 'uniswap',
        'aave': 'aave',
        'crv': 'curve-dao-token',
        'snx': 'synthetix-network-token',
        'mkr': 'maker',
        'comp': 'compound-governance-token'
    }
};

/* ============================================================================
   CACHE MANAGEMENT
   ========================================================================== */

/**
 * Get cached icon URL
 */
function getCachedIcon(key) {
    try {
        const cached = localStorage.getItem(ICON_CONFIG.CACHE_PREFIX + key);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        // Check if cache is still valid
        if (age < ICON_CONFIG.CACHE_DURATION) {
            return data.url;
        }

        // Cache expired, remove it
        localStorage.removeItem(ICON_CONFIG.CACHE_PREFIX + key);
        return null;
    } catch (error) {
        console.warn('Cache read error:', error);
        return null;
    }
}

/**
 * Cache icon URL
 */
function cacheIcon(key, url) {
    try {
        const data = {
            url: url,
            timestamp: Date.now()
        };
        localStorage.setItem(ICON_CONFIG.CACHE_PREFIX + key, JSON.stringify(data));
    } catch (error) {
        console.warn('Cache write error:', error);
    }
}

/**
 * Cache negative result (404) to avoid repeated requests
 */
function cacheNegativeResult(key) {
    cacheIcon(key, '__NOTFOUND__');
}

/**
 * Check if result is cached negative
 */
function isNegativeCached(key) {
    const cached = getCachedIcon(key);
    return cached === '__NOTFOUND__';
}

/* ============================================================================
   URL BUILDERS
   ========================================================================== */

/**
 * Build Trust Wallet Assets URL
 */
function getTrustWalletUrl(blockchain, contractAddress) {
    const chain = ICON_CONFIG.TRUST_WALLET_CHAINS[blockchain?.toLowerCase()];
    if (!chain || !contractAddress) return null;

    // Ensure address is checksummed (0x prefix + 40 hex chars)
    const address = contractAddress.startsWith('0x') ? contractAddress : '0x' + contractAddress;
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;

    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/assets/${address}/logo.png`;
}

/**
 * Build jsDelivr CDN URL
 */
function getJsDelivrUrl(symbol) {
    if (!symbol) return null;
    return `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/${symbol.toLowerCase()}.svg`;
}

/**
 * Build CoinGecko asset URL (from ID)
 */
function getCoinGeckoImageUrl(coinId, size = 'small') {
    if (!coinId) return null;
    // CoinGecko uses a specific ID for each coin
    const id = ICON_CONFIG.COINGECKO_IDS[coinId.toLowerCase()] || coinId.toLowerCase();
    return `https://assets.coingecko.com/coins/images/*/small/${id}.png`;
}

/* ============================================================================
   IMAGE VALIDATION
   ========================================================================== */

/**
 * Check if image URL exists and is valid
 */
async function validateImageUrl(url) {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            cache: 'force-cache'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Validate image by loading it
 */
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = url;
    });
}

/* ============================================================================
   PLACEHOLDER GENERATION
   ========================================================================== */

/**
 * Generate SVG placeholder for token
 */
function generatePlaceholder(symbol, size = 48) {
    const text = symbol ? symbol.slice(0, 2).toUpperCase() : '?';

    // Color palette for gradients
    const gradients = [
        ['#3EB85F', '#2EA44F'], // Green (BroFit primary)
        ['#667eea', '#764ba2'], // Purple
        ['#f093fb', '#f5576c'], // Pink
        ['#4facfe', '#00f2fe'], // Blue
        ['#43e97b', '#38f9d7'], // Cyan
        ['#fa709a', '#fee140']  // Orange
    ];

    // Pick color based on first char
    const charCode = symbol ? symbol.charCodeAt(0) : 0;
    const gradient = gradients[charCode % gradients.length];

    const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad-${charCode}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${gradient[0]};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${gradient[1]};stop-opacity:1" />
                </linearGradient>
            </defs>
            <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#grad-${charCode})" />
            <text
                x="50%"
                y="50%"
                dominant-baseline="middle"
                text-anchor="middle"
                fill="white"
                font-family="Inter, -apple-system, sans-serif"
                font-size="${size * 0.4}"
                font-weight="700"
            >${text}</text>
        </svg>
    `.trim();

    return 'data:image/svg+xml;base64,' + btoa(svg);
}

/* ============================================================================
   MAIN TOKEN ICON LOADER
   ========================================================================== */

/**
 * Get token icon URL with intelligent multi-source fallback
 *
 * @param {Object} token - Token object
 * @param {string} token.symbol - Token symbol (e.g., 'ETH', 'USDT')
 * @param {string} token.address - Token contract address
 * @param {string} token.blockchain - Blockchain network (e.g., 'ethereum', 'polygon')
 * @param {string} token.name - Token name (optional)
 * @param {string} token.logoURI - Pre-existing logo URI (optional, highest priority)
 * @param {number} size - Desired icon size in pixels (default: 48)
 * @returns {Promise<string>} - Icon URL or data URI
 */
async function getTokenIcon(token, size = 48) {
    const { symbol, address, blockchain, logoURI } = token;

    // Generate cache key
    const cacheKey = `${blockchain}_${address || symbol}`.toLowerCase();

    // Check cache first
    const cached = getCachedIcon(cacheKey);
    if (cached) {
        return cached === '__NOTFOUND__' ? generatePlaceholder(symbol, size) : cached;
    }

    // Priority 0: Pre-existing logoURI (from API)
    if (logoURI) {
        try {
            await loadImage(logoURI);
            cacheIcon(cacheKey, logoURI);
            return logoURI;
        } catch (error) {
            console.warn('LogoURI failed:', logoURI);
        }
    }

    // Priority 1: Trust Wallet Assets
    if (blockchain && address) {
        const trustWalletUrl = getTrustWalletUrl(blockchain, address);
        if (trustWalletUrl) {
            try {
                await loadImage(trustWalletUrl);
                cacheIcon(cacheKey, trustWalletUrl);
                return trustWalletUrl;
            } catch (error) {
                console.warn('Trust Wallet failed:', trustWalletUrl);
            }
        }
    }

    // Priority 2: jsDelivr CDN
    if (symbol) {
        const jsDelivrUrl = getJsDelivrUrl(symbol);
        try {
            await loadImage(jsDelivrUrl);
            cacheIcon(cacheKey, jsDelivrUrl);
            return jsDelivrUrl;
        } catch (error) {
            console.warn('jsDelivr failed:', jsDelivrUrl);
        }
    }

    // Priority 3: Try common CoinGecko paths
    if (symbol && ICON_CONFIG.COINGECKO_IDS[symbol.toLowerCase()]) {
        const coinId = ICON_CONFIG.COINGECKO_IDS[symbol.toLowerCase()];
        // CoinGecko URL requires coin ID number, which varies
        // Will be handled by CoinGecko API integration
    }

    // Cache negative result to avoid future attempts
    cacheNegativeResult(cacheKey);

    // Fallback: Generate placeholder
    return generatePlaceholder(symbol, size);
}

/**
 * Preload icons for multiple tokens
 *
 * @param {Array} tokens - Array of token objects
 * @param {number} size - Icon size
 * @returns {Promise<Object>} - Map of token keys to icon URLs
 */
async function preloadTokenIcons(tokens, size = 48) {
    const results = {};

    // Process in batches to avoid overwhelming the browser
    const BATCH_SIZE = 10;
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (token) => {
            const key = `${token.blockchain}_${token.address || token.symbol}`.toLowerCase();
            const url = await getTokenIcon(token, size);
            results[key] = url;
        });

        await Promise.all(promises);
    }

    return results;
}

/**
 * Clear icon cache
 */
function clearIconCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith(ICON_CONFIG.CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
    console.log('Token icon cache cleared');
}

/**
 * Get cache statistics
 */
function getIconCacheStats() {
    const keys = Object.keys(localStorage);
    const iconKeys = keys.filter(k => k.startsWith(ICON_CONFIG.CACHE_PREFIX));

    let valid = 0;
    let expired = 0;
    let negative = 0;

    iconKeys.forEach(key => {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            const age = Date.now() - data.timestamp;

            if (data.url === '__NOTFOUND__') {
                negative++;
            } else if (age < ICON_CONFIG.CACHE_DURATION) {
                valid++;
            } else {
                expired++;
            }
        } catch (error) {
            // Ignore parsing errors
        }
    });

    return {
        total: iconKeys.length,
        valid,
        expired,
        negative,
        cacheHitRate: iconKeys.length > 0 ? (valid / iconKeys.length * 100).toFixed(2) + '%' : '0%'
    };
}

/* ============================================================================
   EXPORTS
   ========================================================================== */

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getTokenIcon,
        preloadTokenIcons,
        generatePlaceholder,
        clearIconCache,
        getIconCacheStats,
        getCachedIcon,
        cacheIcon
    };
}
