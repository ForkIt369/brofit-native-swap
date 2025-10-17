/**
 * BroHub Shared Utilities
 * Web3 helpers, formatting functions, and common utilities
 */

/* ============================================================================
   WEB3 UTILITIES
   ========================================================================== */

/**
 * Check if MetaMask is installed
 */
function isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
}

/**
 * Connect to MetaMask wallet
 */
async function connectWallet() {
    if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed');
    }

    try {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        const chainId = await window.ethereum.request({
            method: 'eth_chainId'
        });

        return {
            address: accounts[0],
            chainId: parseInt(chainId, 16)
        };
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
    }
}

/**
 * Get current wallet address
 */
async function getWalletAddress() {
    if (!isMetaMaskInstalled()) {
        return null;
    }

    try {
        const accounts = await window.ethereum.request({
            method: 'eth_accounts'
        });
        return accounts[0] || null;
    } catch (error) {
        console.error('Failed to get wallet address:', error);
        return null;
    }
}

/**
 * Get current chain ID
 */
async function getChainId() {
    if (!isMetaMaskInstalled()) {
        return null;
    }

    try {
        const chainId = await window.ethereum.request({
            method: 'eth_chainId'
        });
        return parseInt(chainId, 16);
    } catch (error) {
        console.error('Failed to get chain ID:', error);
        return null;
    }
}

/**
 * Switch to a different chain
 */
async function switchChain(chainId) {
    if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed');
    }

    const chainIdHex = '0x' + chainId.toString(16);

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }]
        });
        return true;
    } catch (error) {
        // Chain not added to MetaMask
        if (error.code === 4902) {
            throw new Error('Chain not added to MetaMask');
        }
        throw error;
    }
}

/**
 * Get ERC20 token balance
 */
async function getTokenBalance(tokenAddress, walletAddress) {
    if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed');
    }

    // Native token (ETH)
    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
        try {
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [walletAddress, 'latest']
            });
            return parseInt(balance, 16);
        } catch (error) {
            console.error('Failed to get ETH balance:', error);
            return 0;
        }
    }

    // ERC20 token
    const balanceOfABI = '0x70a08231' + walletAddress.slice(2).padStart(64, '0');

    try {
        const balance = await window.ethereum.request({
            method: 'eth_call',
            params: [{
                to: tokenAddress,
                data: balanceOfABI
            }, 'latest']
        });
        return parseInt(balance, 16);
    } catch (error) {
        console.error('Failed to get token balance:', error);
        return 0;
    }
}

/* ============================================================================
   FORMATTING UTILITIES
   ========================================================================== */

/**
 * Format number with commas
 */
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }

    const number = typeof num === 'string' ? parseFloat(num) : num;

    return number.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Format currency (USD)
 */
function formatCurrency(amount, decimals = 2) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '$0.00';
    }

    const number = typeof amount === 'string' ? parseFloat(amount) : amount;

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
}

/**
 * Format token amount with appropriate decimals
 */
function formatTokenAmount(amount, decimals = 18, displayDecimals = 4) {
    if (amount === null || amount === undefined) {
        return '0';
    }

    const number = typeof amount === 'string' ? parseFloat(amount) : amount;
    const divided = number / Math.pow(10, decimals);

    // For very small amounts, show more decimals
    if (divided < 0.0001 && divided > 0) {
        return divided.toFixed(8);
    }

    return formatNumber(divided, displayDecimals);
}

/**
 * Format large numbers with K, M, B suffixes
 */
function formatCompactNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }

    const number = typeof num === 'string' ? parseFloat(num) : num;

    if (number >= 1e9) {
        return (number / 1e9).toFixed(2) + 'B';
    }
    if (number >= 1e6) {
        return (number / 1e6).toFixed(2) + 'M';
    }
    if (number >= 1e3) {
        return (number / 1e3).toFixed(2) + 'K';
    }
    return number.toFixed(2);
}

/**
 * Format wallet address (0x1234...5678)
 */
function formatAddress(address, startChars = 6, endChars = 4) {
    if (!address) {
        return '';
    }

    if (address.length <= startChars + endChars) {
        return address;
    }

    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format transaction hash
 */
function formatTxHash(hash) {
    return formatAddress(hash, 10, 8);
}

/**
 * Format percentage
 */
function formatPercentage(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }

    const number = typeof value === 'string' ? parseFloat(value) : value;
    return number.toFixed(decimals) + '%';
}

/**
 * Format date/time
 */
function formatDateTime(timestamp) {
    const date = new Date(timestamp);

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

/* ============================================================================
   VALIDATION UTILITIES
   ========================================================================== */

/**
 * Validate Ethereum address
 */
function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate transaction hash
 */
function isValidTxHash(hash) {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate number input
 */
function isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Validate positive number
 */
function isPositiveNumber(value) {
    return isValidNumber(value) && parseFloat(value) > 0;
}

/* ============================================================================
   TOKEN ICON UTILITIES
   ========================================================================== */

/**
 * Get chain icon URL with multi-tier fallback
 */
function getChainIconUrl(chain) {
    const chainId = chain.chain_id || chain.id;
    const symbol = (chain.symbol || chain.name).toLowerCase();

    // Chain logo mapping for major chains
    const chainLogos = {
        // Ethereum
        'eth': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        'ethereum': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        '1': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',

        // Polygon
        'matic': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        'polygon': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        '137': 'https://cryptologos.cc/logos/polygon-matic-logo.png',

        // BNB Chain
        'bnb': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
        'bsc': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
        '56': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',

        // Arbitrum
        'arbitrum': 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
        '42161': 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',

        // Optimism
        'optimism': 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
        '10': 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',

        // Avalanche
        'avax': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
        'avalanche': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
        '43114': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',

        // Fantom
        'ftm': 'https://cryptologos.cc/logos/fantom-ftm-logo.png',
        'fantom': 'https://cryptologos.cc/logos/fantom-ftm-logo.png',
        '250': 'https://cryptologos.cc/logos/fantom-ftm-logo.png',

        // Gnosis
        'xdai': 'https://cryptologos.cc/logos/gnosis-gno-gno-logo.png',
        'gnosis': 'https://cryptologos.cc/logos/gnosis-gno-gno-logo.png',
        '100': 'https://cryptologos.cc/logos/gnosis-gno-gno-logo.png',

        // Moonbeam
        'glmr': 'https://assets.coingecko.com/coins/images/22459/small/glmr.png',
        'moonbeam': 'https://assets.coingecko.com/coins/images/22459/small/glmr.png',
        '1284': 'https://assets.coingecko.com/coins/images/22459/small/glmr.png',

        // Moonriver
        'movr': 'https://assets.coingecko.com/coins/images/17984/small/9285.png',
        'moonriver': 'https://assets.coingecko.com/coins/images/17984/small/9285.png',
        '1285': 'https://assets.coingecko.com/coins/images/17984/small/9285.png'
    };

    // Try by chain ID first
    if (chainId && chainLogos[String(chainId)]) {
        return chainLogos[String(chainId)];
    }

    // Try by symbol
    if (chainLogos[symbol]) {
        return chainLogos[symbol];
    }

    // Try by name
    if (chain.name && chainLogos[chain.name.toLowerCase()]) {
        return chainLogos[chain.name.toLowerCase()];
    }

    // Fallback: return null so caller can use text fallback
    return null;
}

/**
 * Get token icon URL with multi-tier fallback
 */
function getTokenIconUrl(token) {
    const address = token.address || token.contract_address;
    const symbol = (token.symbol || '').toUpperCase();
    const networkId = token.network_id || 'ethereum';

    // Priority 1: RocketX CDN logo_uri
    if (token.logo_uri || token.logoURI) {
        return token.logo_uri || token.logoURI;
    }

    // Priority 2: Known native tokens (no address)
    if (!address || address === '0x0000000000000000000000000000000000000000') {
        const nativeTokens = {
            'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
            'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
            'MATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
            'AVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
            'FTM': 'https://cryptologos.cc/logos/fantom-ftm-logo.png',
            'xDAI': 'https://cryptologos.cc/logos/gnosis-gno-gno-logo.png',
            'GLMR': 'https://assets.coingecko.com/coins/images/22459/small/glmr.png',
            'MOVR': 'https://assets.coingecko.com/coins/images/17984/small/9285.png'
        };

        if (nativeTokens[symbol]) {
            return nativeTokens[symbol];
        }
    }

    // Priority 3: Trust Wallet (for Ethereum ERC20 tokens with address)
    if (address && address !== '0x0000000000000000000000000000000000000000') {
        // Map network IDs to Trust Wallet blockchain names
        const trustWalletNetworks = {
            'ethereum': 'ethereum',
            'bsc': 'smartchain',
            'polygon': 'polygon',
            'avalanche': 'avalanchec'
        };

        const twNetwork = trustWalletNetworks[networkId] || 'ethereum';
        return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${twNetwork}/assets/${address}/logo.png`;
    }

    // Priority 4: CoinGecko API (fixed URL)
    if (symbol) {
        // Common token ID mappings for CoinGecko
        const geckoIds = {
            'WETH': 'weth',
            'USDT': 'tether',
            'USDC': 'usd-coin',
            'DAI': 'dai',
            'WBTC': 'wrapped-bitcoin',
            'UNI': 'uniswap',
            'LINK': 'chainlink',
            'AAVE': 'aave',
            'MATIC': 'matic-network',
            'BNB': 'binancecoin'
        };

        const tokenId = geckoIds[symbol] || symbol.toLowerCase();
        return `https://assets.coingecko.com/coins/images/1/small/${tokenId}.png`;
    }

    // Fallback: Generate placeholder
    return generateTokenPlaceholder(symbol || '?');
}

/**
 * Generate token placeholder icon (data URI)
 */
function generateTokenPlaceholder(symbol) {
    const text = symbol ? symbol.slice(0, 2).toUpperCase() : '?';
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 32, 32);
    gradient.addColorStop(0, '#3EB85F');
    gradient.addColorStop(1, '#2EA44F');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 16, 16);

    return canvas.toDataURL();
}

/* ============================================================================
   LOCAL STORAGE UTILITIES
   ========================================================================== */

/**
 * Save to localStorage with JSON serialization
 */
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
}

/**
 * Load from localStorage with JSON parsing
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Remove from localStorage
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Failed to remove from localStorage:', error);
        return false;
    }
}

/* ============================================================================
   ERROR HANDLING UTILITIES
   ========================================================================== */

/**
 * Parse Web3 error message
 */
function parseWeb3Error(error) {
    if (typeof error === 'string') {
        return error;
    }

    if (error.message) {
        // MetaMask user rejection
        if (error.code === 4001) {
            return 'Transaction rejected by user';
        }

        // Insufficient funds
        if (error.message.includes('insufficient funds')) {
            return 'Insufficient funds for transaction';
        }

        // Gas estimation failed
        if (error.message.includes('gas required exceeds')) {
            return 'Transaction would fail - check token balance and allowance';
        }

        return error.message;
    }

    return 'Unknown error occurred';
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style based on type
    const colors = {
        success: '#30D158',
        error: '#FF453A',
        warning: '#FFD60A',
        info: '#64D2FF'
    };

    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid ${colors[type] || colors.info};
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duration);
}

/* ============================================================================
   DEBOUNCE & THROTTLE
   ========================================================================== */

/**
 * Debounce function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function calls
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/* ============================================================================
   COPY TO CLIPBOARD
   ========================================================================== */

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success', 2000);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showNotification('Failed to copy', 'error', 2000);
        return false;
    }
}

/* ============================================================================
   BLOCKCHAIN EXPLORER LINKS
   ========================================================================== */

/**
 * Get block explorer URL for transaction
 */
function getExplorerTxUrl(txHash, chainId) {
    const explorers = {
        1: 'https://etherscan.io/tx/',
        5: 'https://goerli.etherscan.io/tx/',
        56: 'https://bscscan.com/tx/',
        137: 'https://polygonscan.com/tx/',
        42161: 'https://arbiscan.io/tx/',
        10: 'https://optimistic.etherscan.io/tx/',
        43114: 'https://snowtrace.io/tx/'
    };

    const baseUrl = explorers[chainId] || explorers[1];
    return baseUrl + txHash;
}

/**
 * Get block explorer URL for address
 */
function getExplorerAddressUrl(address, chainId) {
    const explorers = {
        1: 'https://etherscan.io/address/',
        5: 'https://goerli.etherscan.io/address/',
        56: 'https://bscscan.com/address/',
        137: 'https://polygonscan.com/address/',
        42161: 'https://arbiscan.io/address/',
        10: 'https://optimistic.etherscan.io/address/',
        43114: 'https://snowtrace.io/address/'
    };

    const baseUrl = explorers[chainId] || explorers[1];
    return baseUrl + address;
}

/* ============================================================================
   EXPORT ALL UTILITIES
   ========================================================================== */

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Web3
        isMetaMaskInstalled,
        connectWallet,
        getWalletAddress,
        getChainId,
        switchChain,
        getTokenBalance,

        // Formatting
        formatNumber,
        formatCurrency,
        formatTokenAmount,
        formatCompactNumber,
        formatAddress,
        formatTxHash,
        formatPercentage,
        formatDateTime,
        formatRelativeTime,

        // Validation
        isValidAddress,
        isValidTxHash,
        isValidNumber,
        isPositiveNumber,

        // Token & Chain icons
        getTokenIconUrl,
        getChainIconUrl,
        generateTokenPlaceholder,

        // Storage
        saveToStorage,
        loadFromStorage,
        removeFromStorage,

        // Error handling
        parseWeb3Error,
        showNotification,

        // Performance
        debounce,
        throttle,

        // Clipboard
        copyToClipboard,

        // Explorers
        getExplorerTxUrl,
        getExplorerAddressUrl
    };
}
