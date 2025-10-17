# ⚠️ Moralis API Key Expired - Action Required

**Date**: October 17, 2025
**Status**: 🔴 **CRITICAL - API Key Invalid/Expired**

---

## 🐛 Current Issue

Your Moralis API calls are returning **401 Unauthorized** errors. The API key in `widgets/shared/moralis-api.js` has expired or is invalid.

**Error Logs**:
```
Failed to load resource: the server responded with a status of 401 ()
Moralis API error: 401 Unauthorized
Failed to get tokens for 0x111e5ec92a6a0bba703bd8d6240791aee25052b0 on eth
```

---

## 🔑 How to Get a New Moralis API Key

### Step 1: Go to Moralis Dashboard
Visit: https://admin.moralis.io/

### Step 2: Sign In or Create Account
- Sign in with your existing Moralis account
- Or create a new free account

### Step 3: Create a New Project
1. Click "Create New Project" (if you don't have one)
2. Choose **Web3 API** project
3. Select **EVM** chains

### Step 4: Get Your API Key
1. Go to "Settings" → "API Keys"
2. Copy your API Key (format: `eyJhbGc...`)
3. **IMPORTANT**: Free tier includes:
   - **40,000 Compute Units/month**
   - Multiple chain support
   - Portfolio tracking
   - Token balances

### Step 5: Update the Key in Code
Replace the key in `/Users/digitaldavinci/brofit demo/brofit-native-swap/widgets/shared/moralis-api.js` line 14:

```javascript
const MORALIS_CONFIG = {
    API_KEY: 'YOUR_NEW_API_KEY_HERE',  // ← Replace this
    BASE_URL: 'https://deep-index.moralis.io/api/v2.2',
    // ... rest of config
};
```

---

## 🚀 Alternative Solutions

### Option 1: Use Alchemy API (Alternative Provider)
If you can't get a new Moralis key, you can use Alchemy instead:

1. Visit: https://www.alchemy.com/
2. Create free account
3. Get API key
4. I can help migrate the code to use Alchemy's API

### Option 2: Use Covalent API (Alternative Provider)
Another option with generous free tier:

1. Visit: https://www.covalenthq.com/
2. Create account
3. Get API key
4. I can help migrate to Covalent

### Option 3: Demo/Mock Mode (Temporary)
For development/testing without real data:

I can add a mock mode that returns fake portfolio data so you can test the UI without API calls.

---

## 📋 Quick Fix Steps

### Immediate Action (5 minutes):
1. Open browser to https://admin.moralis.io/
2. Sign in or create account
3. Create new project
4. Copy API key
5. Send me the new key, and I'll update the code

### Or Ask Me To:
- [ ] Add demo/mock mode for testing
- [ ] Migrate to Alchemy API
- [ ] Migrate to Covalent API
- [ ] Add multiple API key support (fallback)

---

## 🔧 What Needs the API Key

The Moralis API is used for:
- ✅ **Multi-chain token balances** (7 chains: eth, polygon, bsc, arbitrum, optimism, avalanche, fantom)
- ✅ **Portfolio USD values**
- ✅ **Token metadata** (names, symbols, decimals)
- ✅ **Token prices** (24h change, current price)
- ✅ **Transaction history**
- ✅ **NFT holdings**

**Without a valid API key**, the app cannot load real portfolio data.

---

##  📊 API Key Comparison

| Provider | Free Tier | Chains Supported | Portfolio API | Best For |
|----------|-----------|------------------|---------------|----------|
| **Moralis** | 40K CU/month | 25+ EVM chains | ✅ Yes | Multi-chain portfolios |
| **Alchemy** | 300M CU/month | 15+ chains | ✅ Yes | High request volume |
| **Covalent** | 100K credits | 200+ chains | ✅ Yes | Maximum chain coverage |
| **Infura** | 100K req/day | 10+ chains | ❌ No | Basic RPC calls |

**Recommendation**: Stick with Moralis (easiest) or migrate to Alchemy (best free tier).

---

## 🛠️ Temporary Workaround

While you get a new API key, I can add a demo mode that shows fake data:

```javascript
const DEMO_PORTFOLIO = {
    holdings: [
        { token: 'ETH', balance: '1.5', value: 3500, chain: 'eth' },
        { token: 'USDT', balance: '1000', value: 1000, chain: 'eth' },
        { token: 'MATIC', balance: '500', value: 450, chain: 'polygon' }
    ],
    totalValue: 4950,
    activeChains: 2,
    totalAssets: 3
};
```

This will let you test the UI while waiting for the API key.

---

## 📞 Next Steps

**Please choose one:**

1. **"I'll get a new Moralis key"** - Send it to me when ready
2. **"Add demo mode"** - I'll add fake data for testing
3. **"Migrate to Alchemy"** - I'll switch to Alchemy API
4. **"Migrate to Covalent"** - I'll switch to Covalent API

---

**Status**: ⏳ **Waiting for user action**
**Impact**: 🔴 **App cannot load real portfolio data**
**Time to Fix**: ⚡ **5 minutes with new API key**
