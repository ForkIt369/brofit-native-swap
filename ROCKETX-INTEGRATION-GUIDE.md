# RocketX API Integration Guide for BroFit

## 🚨 Critical Bugs to Fix IMMEDIATELY

### Bug #1: Connect Wallet Button Broken
**File**: `index.html:190`
**Issue**: Missing `constants.js` import causes wallet connection to fail

**Fix**:
```html
<!-- Add this line BEFORE dashboard.js -->
<script src="/js/constants.js"></script>
<script src="/js/dashboard.js"></script>
```

**Error**: `TypeError: Cannot read properties of undefined (reading 'NOTIFICATION_DURATION')`

---

### Bug #2: Wrong RocketX Endpoint (404 Error)
**File**: `widgets/shared/rocketx-api.js:145-156`
**Issue**: `/v1/supported-chains` endpoint doesn't exist

**Current Code** (❌ WRONG):
```javascript
async getSupportedChains() {
    return this._getCached('chains', async () => {
        try {
            const data = await this._request('/v1/supported-chains'); // 404!
            return data.chains || [];
        } catch (error) {
            return this._getFallbackChains(); // Only returns 10 chains
        }
    });
}
```

**Fixed Code** (✅ CORRECT):
```javascript
async getSupportedChains() {
    return this._getCached('chains', async () => {
        try {
            const data = await this._request('/v1/configs');
            const networks = (data.supported_network || [])
                .filter(n => n.enabled === 1)
                .map(n => ({
                    id: n.id,
                    name: n.name,
                    chain_id: parseInt(n.chainId, 16),
                    chainId: n.chainId,
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
            return networks; // Returns 197 chains instead of 10!
        } catch (error) {
            return this._getFallbackChains();
        }
    });
}
```

**Impact**: Increases chain support from 10 to 197 (1,970% increase!)

---

### Bug #3: Incorrect Swap Payload Format
**File**: `widgets/shared/rocketx-api.js` (swap execution method)
**Issue**: Using token addresses instead of token IDs

**CRITICAL**: RocketX `/v1/swap` requires token IDs, not contract addresses!

**Implementation Steps**:

1. **Add Token ID Resolution Method**:
```javascript
async getTokenId(chainId, tokenAddress) {
    // Search for token on the specified chain
    const response = await this._request(`/v1/tokens?chainId=${chainId}&keyword=${tokenAddress}&perPage=100`);
    const tokens = response.tokens || [];

    // Find exact match
    const token = tokens.find(t =>
        t.contract_address.toLowerCase() === tokenAddress.toLowerCase() ||
        t.token_symbol.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (!token) {
        throw new Error(`Token not found: ${tokenAddress} on chain ${chainId}`);
    }

    return token.id; // Return the internal RocketX token ID
}
```

2. **Update Swap Method**:
```javascript
async executeSwap(fromToken, toToken, amount, userAddress, slippage = 1) {
    // First, get token IDs
    const fromTokenId = await this.getTokenId(fromToken.chainId, fromToken.address);
    const toTokenId = await this.getTokenId(toToken.chainId, toToken.address);

    // Build swap payload with token IDs
    const payload = {
        fromTokenId: fromTokenId,
        toTokenId: toTokenId,
        fromTokenAmount: amount,
        slippage: slippage,
        userAddress: userAddress,
        referrer: "0x0000000000000000000000000000000000000000", // TODO: Add your referrer address
        partnerId: "brofit" // Optional
    };

    // Execute swap
    const response = await this._request('/v1/swap', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api': this.apiKey
        },
        body: JSON.stringify(payload)
    });

    return response;
}
```

3. **Cache Token ID Mappings**:
```javascript
constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.rocketx.exchange';
    this.cache = {};
    this.tokenIdCache = {}; // Add this for token ID caching
}

async getTokenId(chainId, tokenAddress) {
    const cacheKey = `${chainId}:${tokenAddress.toLowerCase()}`;

    // Check cache first
    if (this.tokenIdCache[cacheKey]) {
        return this.tokenIdCache[cacheKey];
    }

    // ... search logic from above ...

    // Cache the result
    this.tokenIdCache[cacheKey] = token.id;
    return token.id;
}
```

---

## 🔑 Essential API Information

### Rate Limits
- **150 requests per minute** OR **50 requests per second** per IP address
- Implement client-side rate limiting to avoid 429 errors

### Native Token Placeholder Addresses
- **Walletless enabled**: `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`
- **Walletless disabled**: `0x0000000000000000000000000000000000000000`

### Common Token IDs
```javascript
const COMMON_TOKEN_IDS = {
    ETH: 1,
    BNB: 2,
    POL: 3,  // MATIC
    USDT: 4,
    USDC: 5
};
```

### Transaction Status Flow
1. `transaction_pending` - Request ID generated
2. `pending` - Pending receiving deposit
3. `approved` - Deposit received
4. `executed` - Swap completed
5. `withdrawal` - Withdrawal initiated
6. `withdraw_success` - ✅ Tokens transferred successfully
7. `invalid` - ❌ Transaction timed out

### Revenue Sharing (💰 Earning Opportunity!)
- Set `referrer` address in swap payload
- Earn **70% of fees charged**
- Example: Charge 1% fee ($2) → You earn $1.40

**Implementation**:
```javascript
const payload = {
    // ... other fields ...
    referrer: "YOUR_WALLET_ADDRESS_HERE", // Replace with your address!
    partnerId: "brofit"
};
```

---

## 📋 Complete Endpoint Reference

### 1. GET /v1/configs
- Master configuration (197 networks, exchanges, settings)
- Replace hardcoded fallback chains

### 2. GET /v1/tokens
- Paginated token list
- **Required params**: `chainId`, `page`, `perPage`
- **Optional**: `keyword` for search
- **Max perPage**: 600

### 3. POST /v1/quotation
- Get swap/bridge quotes
- Returns best route, gas estimates, price impact

### 4. POST /v1/swap
- Execute swap transaction
- **CRITICAL**: Uses token IDs, not addresses!
- Returns `requestId` for status tracking

### 5. GET /v1/status
- Check transaction progress
- **Params**: `requestId` (required), `txId` (optional)
- Returns detailed subState and transaction hashes

---

## 🚀 Quick Implementation Checklist

- [ ] **Fix #1**: Add constants.js import to index.html
- [ ] **Fix #2**: Update getSupportedChains() to use /v1/configs
- [ ] **Fix #3**: Implement token ID resolution system
- [ ] **Fix #4**: Update swap payload to use token IDs
- [ ] **Enhancement #1**: Add token ID caching
- [ ] **Enhancement #2**: Configure referrer address for revenue sharing
- [ ] **Enhancement #3**: Implement client-side rate limiting
- [ ] **Enhancement #4**: Add proper transaction status polling

---

## 📚 Documentation Resources

- **ZenSis Memory**: `4bf0bca9-b9a0-4b39-8a73-779c90c760cd` (Complete API Reference)
- **Postman Docs**: https://documenter.getpostman.com/view/31745911/2sAYJ7feNK
- **GitHub Reference**: https://github.com/rocketx-labs/integration_reference
- **Official Docs**: https://www.rocketx.exchange/docs
- **configs.json**: `/Users/digitaldavinci/Desktop/configs.json`

---

## ⚠️ Security Notes

1. **API Keys**: Move to backend proxy for production
2. **Never expose** API keys in frontend JavaScript
3. **Current demo** uses free tier keys (rate limits apply)
4. **Implement** proper CORS and origin validation

---

**Last Updated**: 2025-10-23
**Status**: Critical bugs identified, fixes documented
**Next Steps**: Apply fixes sequentially, starting with Bug #1
