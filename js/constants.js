/* ========================================
   💪 BROFIT CONSTANTS
   Application-wide configuration values
   ======================================== */

/**
 * Notification Durations (milliseconds)
 */
const NOTIFICATION_DURATION = {
    SHORT: 2000,      // 2 seconds - Quick messages
    MEDIUM: 3000,     // 3 seconds - Standard messages
    LONG: 5000,       // 5 seconds - Errors and important info
    EXTENDED: 8000,   // 8 seconds - Complex errors
    PERSISTENT: 10000 // 10 seconds - Demo mode notifications
};

/**
 * API Timeouts (milliseconds)
 */
const API_TIMEOUT = {
    PORTFOLIO: 60000,  // 60 seconds - Portfolio data loading
    QUOTE: 30000,      // 30 seconds - Swap/bridge quotes
    TRANSACTION: 120000 // 120 seconds - Transaction completion
};

/**
 * Cache Durations (milliseconds)
 */
const CACHE_DURATION = {
    SHORT: 30 * 1000,          // 30 seconds - Volatile data (balances)
    MEDIUM: 5 * 60 * 1000,     // 5 minutes - Semi-static data (prices)
    LONG: 10 * 60 * 1000,      // 10 minutes - Static data (metadata)
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours - Rarely changing data
    PERMANENT: 48 * 60 * 60 * 1000  // 48 hours - Almost permanent data
};

/**
 * Debounce Delays (milliseconds)
 */
const DEBOUNCE_DELAY = {
    SEARCH: 300,       // 300ms - Search input
    INPUT: 500,        // 500ms - Form inputs
    STORAGE: 500,      // 500ms - localStorage saves
    RESIZE: 250        // 250ms - Window resize
};

/**
 * UI Z-Index Layers
 */
const Z_INDEX = {
    BASE: 1,
    DROPDOWN: 1000,
    MODAL: 9000,
    OVERLAY: 9999,
    LOADING: 10000,
    NOTIFICATION: 10001
};

/**
 * Transaction Limits
 */
const TRANSACTION_LIMITS = {
    MAX_HISTORY: 50,    // Maximum transactions to store in history
    MAX_DISPLAY: 5      // Maximum recent transactions to display
};

/**
 * Portfolio Display Limits
 */
const PORTFOLIO_LIMITS = {
    TOP_HOLDINGS: 3,    // Top holdings to display on dashboard
    MAX_TOKENS: 100     // Maximum tokens to fetch per chain
};

/**
 * Supported Blockchain Networks
 */
const SUPPORTED_CHAINS = {
    COUNT: 10,
    BLOCKCHAINS: 6
};

/**
 * Animation Durations (milliseconds)
 */
const ANIMATION_DURATION = {
    FAST: 200,          // 200ms - Quick transitions
    MEDIUM: 300,        // 300ms - Standard animations
    SLOW: 500           // 500ms - Deliberate animations
};

// Browser global exposure (for <script> tag usage)
if (typeof window !== 'undefined') {
    window.BRO_CONSTANTS = {
        NOTIFICATION_DURATION,
        API_TIMEOUT,
        CACHE_DURATION,
        DEBOUNCE_DELAY,
        Z_INDEX,
        TRANSACTION_LIMITS,
        PORTFOLIO_LIMITS,
        SUPPORTED_CHAINS,
        ANIMATION_DURATION
    };
    console.log('✅ BroFit constants loaded');
}
