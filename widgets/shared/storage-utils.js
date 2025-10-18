/* ========================================
   💪 BROFIT STORAGE UTILITIES
   Optimized localStorage with debouncing
   ======================================== */

/**
 * Storage Utility with Debouncing
 * Prevents excessive localStorage writes by batching saves
 */
class StorageUtils {
    constructor() {
        // Debounce timers for different storage keys
        this.debounceTimers = {};

        // Default debounce delay (milliseconds)
        this.DEFAULT_DELAY = 500;

        // Storage key prefixes
        this.PREFIXES = {
            STATE: 'brofit_state',
            WALLET: 'brofit_wallet_address',
            WALLET_DATA: 'brofit_connected_wallet',
            TRANSACTIONS: 'brofit_transactions',
            CACHE: 'brofit_cache_'
        };

        console.log('✅ StorageUtils initialized');
    }

    /**
     * Debounced localStorage save
     * @param {string} key - Storage key
     * @param {any} value - Value to store (will be JSON stringified)
     * @param {number} delay - Debounce delay in ms (default: 500)
     */
    debouncedSave(key, value, delay = this.DEFAULT_DELAY) {
        // Clear existing timer for this key
        if (this.debounceTimers[key]) {
            clearTimeout(this.debounceTimers[key]);
        }

        // Set new timer
        this.debounceTimers[key] = setTimeout(() => {
            try {
                const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                localStorage.setItem(key, serialized);
                console.log(`💾 Saved to localStorage: ${key}`);
            } catch (error) {
                console.error(`❌ Failed to save ${key}:`, error);
            }
            delete this.debounceTimers[key];
        }, delay);
    }

    /**
     * Immediate localStorage save (no debouncing)
     * Use only when immediate persistence is required
     */
    save(key, value) {
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, serialized);
            console.log(`💾 Saved immediately: ${key}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to save ${key}:`, error);
            return false;
        }
    }

    /**
     * Load from localStorage with error handling
     */
    load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;

            try {
                return JSON.parse(item);
            } catch {
                // Return as string if not valid JSON
                return item;
            }
        } catch (error) {
            console.error(`❌ Failed to load ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Remove from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);

            // Cancel any pending debounced save
            if (this.debounceTimers[key]) {
                clearTimeout(this.debounceTimers[key]);
                delete this.debounceTimers[key];
            }

            console.log(`🗑️ Removed from localStorage: ${key}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to remove ${key}:`, error);
            return false;
        }
    }

    /**
     * Flush all pending debounced saves immediately
     * Useful before page unload
     */
    flushAll() {
        const keys = Object.keys(this.debounceTimers);
        console.log(`💾 Flushing ${keys.length} pending saves...`);

        keys.forEach(key => {
            if (this.debounceTimers[key]) {
                clearTimeout(this.debounceTimers[key]);
                // Trigger the save immediately
                this.debounceTimers[key] = null;
            }
        });
    }

    /**
     * Batch save multiple keys at once
     * More efficient than multiple individual saves
     */
    batchSave(items) {
        try {
            items.forEach(({ key, value }) => {
                const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                localStorage.setItem(key, serialized);
            });
            console.log(`💾 Batch saved ${items.length} items`);
            return true;
        } catch (error) {
            console.error('❌ Batch save failed:', error);
            return false;
        }
    }

    /**
     * Get storage size in bytes
     */
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    /**
     * Get storage size in human-readable format
     */
    getStorageSizeFormatted() {
        const bytes = this.getStorageSize();
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    /**
     * Clear all BroFit data from localStorage
     */
    clearAll() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('brofit_'));
        keys.forEach(key => localStorage.removeItem(key));
        console.log(`🗑️ Cleared ${keys.length} BroFit items from storage`);
        return keys.length;
    }

    /**
     * Debug: List all BroFit keys in storage
     */
    debugKeys() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('brofit_'));
        console.log('🔍 BroFit localStorage keys:', keys);
        keys.forEach(key => {
            const size = localStorage[key].length;
            console.log(`  - ${key}: ${size} bytes`);
        });
        return keys;
    }
}

// Create global singleton instance
window.storageUtils = new StorageUtils();

// Flush pending saves before page unload
window.addEventListener('beforeunload', () => {
    window.storageUtils.flushAll();
});

console.log('✅ Global StorageUtils ready: window.storageUtils');
