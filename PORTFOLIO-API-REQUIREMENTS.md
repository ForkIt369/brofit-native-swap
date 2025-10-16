# 🎯 BroFit Portfolio Widget - Exact API Requirements

**Last Updated**: 2025-10-16
**Current Status**: Mock Data → Real Data Integration Guide

---

## 📊 Overview: What APIs You Need

To make the Portfolio widget fully functional with **real wallet data**, you need **3 types of APIs**:

1. **Multi-Chain Balance API** - Fetch token balances across 180+ chains
2. **Price Data API** - Get current USD prices and 24h changes
3. **Web3 Provider** - Native blockchain RPC for direct calls (optional enhancement)

---

## 🔥 RECOMMENDED STACK (Easiest Implementation)

### Option A: Moralis + CoinGecko (Fastest to Market)

**Total Cost**: $0 - $49/month (depending on scale)
**Setup Time**: ~2 hours
**Code Complexity**: Low

#### 1. Moralis Web3 Data API

**Purpose**: Fetch all ERC20 token balances across multiple chains in ONE API call

**Documentation**: https://docs.moralis.io/web3-data-api/evm/reference/wallet-api/get-wallet-token-balances

**Pricing**:
- ✅ **Free Tier**: 40,000 requests/month (1,333/day)
- 💰 **Pro Tier**: $49/month - 3M requests/month
- **Cost per request**: ~$0.000016 (negligible)

**Key Features**:
- ✅ 180+ EVM chains (Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, etc.)
- ✅ Automatic token metadata (name, symbol, decimals, logo)
- ✅ Spam token detection (`possible_spam` field)
- ✅ Native + ERC20 token balances
- ✅ Response includes USD prices (optional)
- ✅ Rate limit: 25 requests/second (free tier)

**Single API Endpoint**:
```bash
# Get ALL tokens for a wallet across ALL chains
GET https://deep-index.moralis.io/api/v2.2/wallets/:address/tokens
```

**API Call Example**:
```javascript
// Get ALL tokens with balances AND prices
const response = await fetch(
    `https://deep-index.moralis.io/api/v2.2/wallets/${walletAddress}/tokens?chain=eth&chain=polygon&chain=bsc&chain=arbitrum&chain=optimism&chain=avalanche`,
    {
        headers: {
            'X-API-Key': 'YOUR_MORALIS_API_KEY',
            'accept': 'application/json'
        }
    }
);

const data = await response.json();

/* Response structure:
{
  "tokens": [
    {
      "token_address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      "chain": "eth",
      "symbol": "UNI",
      "name": "Uniswap",
      "logo": "https://cdn.moralis.io/eth/0x1f9840.../logo.png",
      "decimals": 18,
      "balance": "1000000000000000000",  // Raw balance
      "usd_price": 5.67,                 // Current USD price
      "usd_value": 5.67,                 // Total USD value
      "usd_price_24hr_percent_change": 2.3,
      "possible_spam": false
    }
  ]
}
*/
```

**Why Moralis is Recommended**:
- 🎯 **All-in-one**: Balances + metadata + prices in single call
- 🚀 **Fast**: Sub-second response times
- 💰 **Affordable**: Free tier covers ~1,300 portfolio loads/day
- 📚 **Well-documented**: Excellent SDKs for JS/Python
- 🔒 **Reliable**: 99.9% uptime SLA

#### 2. CoinGecko API (Backup/Enhancement)

**Purpose**: Fallback price data + 24h/7d/30d historical changes

**Documentation**: https://docs.coingecko.com/reference/simple-price

**Pricing**:
- ✅ **Free Tier**: 10,000 calls/month (30 calls/min)
- 💰 **Analyst**: $129/month - 500,000 calls/month
- **Cost per request**: ~$0.00026

**Key Features**:
- ✅ 13,000+ cryptocurrencies
- ✅ Real-time prices (updated every 20 seconds)
- ✅ 24h/7d/30d/1y price changes
- ✅ Market cap, volume, supply data
- ✅ Multi-currency support (USD, EUR, BTC, etc.)

**API Call Example**:
```javascript
// Get prices for multiple tokens
const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=uniswap,ethereum,matic-network&vs_currencies=usd&include_24hr_change=true&include_7d_change=true&include_30d_change=true'
);

const prices = await response.json();

/* Response:
{
  "uniswap": {
    "usd": 5.67,
    "usd_24h_change": 2.3,
    "usd_7d_change": 5.8,
    "usd_30d_change": -1.2
  },
  "ethereum": {
    "usd": 3000.50,
    "usd_24h_change": 1.5
  }
}
*/
```

**Why CoinGecko**:
- 🎯 **Price authority**: Most comprehensive crypto price database
- 🚀 **Historical data**: 7d/30d/1y changes included
- 💰 **Free tier sufficient**: 10K calls = 333 portfolio loads/day
- 📈 **Chart data available**: Can add price charts later

#### 3. Ethers.js v6 (Web3 Provider)

**Purpose**: Direct blockchain calls (optional, for maximum accuracy)

**Documentation**: https://docs.ethers.org/v6/

**Pricing**:
- ✅ **Free**: If using public RPC endpoints
- 💰 **Alchemy/Infura**: $0-$49/month for enhanced endpoints

**Key Features**:
- ✅ Read token balances directly from blockchain
- ✅ Check token allowances
- ✅ Query ERC20 contract methods
- ✅ Native ETH/MATIC/BNB balance fetching

**Code Example**:
```javascript
import { ethers } from 'ethers';

// Get native ETH balance
const provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY');
const balance = await provider.getBalance(walletAddress);
const ethBalance = ethers.formatEther(balance);

// Get ERC20 token balance
const tokenABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
const tokenBalance = await tokenContract.balanceOf(walletAddress);
const decimals = await tokenContract.decimals();
const symbol = await tokenContract.symbol();

const formattedBalance = ethers.formatUnits(tokenBalance, decimals);
console.log(`${formattedBalance} ${symbol}`);
```

---

## 💻 COMPLETE IMPLEMENTATION (Option A)

### Step 1: Install Dependencies

```bash
# Via npm
npm install ethers

# Via CDN (for vanilla JS)
# Add to HTML:
<script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js"></script>
```

### Step 2: Get API Keys

1. **Moralis API Key** (Required)
   - Sign up: https://admin.moralis.io/register
   - Free tier: 40,000 requests/month
   - Get your API key from dashboard

2. **CoinGecko API Key** (Optional - Free tier works without key)
   - Sign up: https://www.coingecko.com/en/api/pricing
   - Free tier: No key needed (10,000 calls/month)
   - For 500K calls/month: Get Pro API key ($129/mo)

### Step 3: Replace Mock Data in Portfolio Widget

**File**: `/widgets/portfolio.html`

**Find this section** (lines 585-600):
```javascript
async loadPortfolio() {
    if (!this.walletAddress) {
        console.warn('No wallet connected');
        this.holdings = this.mockHoldings;  // ⚠️ MOCK DATA
        return;
    }

    try {
        // In production, would fetch real balances from multiple chains
        // For prototype, use mock data
        this.holdings = this.mockHoldings;  // ⚠️ STILL MOCK!
    } catch (error) {
        console.error('Failed to load portfolio:', error);
        this.holdings = [];
    }
}
```

**Replace with this REAL implementation**:

```javascript
async loadPortfolio() {
    if (!this.walletAddress) {
        console.warn('No wallet connected');
        this.holdings = [];
        return;
    }

    try {
        console.log('🔄 Fetching portfolio for:', this.walletAddress);

        // 1. Fetch ALL token balances with Moralis (includes prices!)
        const chains = ['eth', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche'];
        const chainQuery = chains.map(c => `chain=${c}`).join('&');

        const response = await fetch(
            `https://deep-index.moralis.io/api/v2.2/wallets/${this.walletAddress}/tokens?${chainQuery}`,
            {
                headers: {
                    'X-API-Key': 'YOUR_MORALIS_API_KEY',  // ⚠️ REPLACE THIS
                    'accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Moralis API error: ${response.status}`);
        }

        const data = await response.json();

        // 2. Transform Moralis response to portfolio format
        this.holdings = data.tokens
            .filter(token => parseFloat(token.balance) > 0)  // Only non-zero balances
            .filter(token => !token.possible_spam)           // Filter spam tokens
            .map(token => ({
                token: token.symbol,
                name: token.name,
                chain: token.chain,
                balance: ethers.formatUnits(token.balance, token.decimals),
                value: parseFloat(token.usd_value) || 0,
                change24h: parseFloat(token.usd_price_24hr_percent_change) || 0,
                logo: token.logo,
                contractAddress: token.token_address
            }))
            .sort((a, b) => b.value - a.value);  // Sort by value descending

        console.log(`✅ Loaded ${this.holdings.length} tokens`);

        // 3. Render portfolio
        this.renderPortfolio();

    } catch (error) {
        console.error('❌ Failed to load portfolio:', error);
        showNotification('Failed to load portfolio: ' + error.message, 'error');
        this.holdings = [];
    }
}
```

### Step 4: Add Enhanced Price Fetching (Optional)

If you want MORE detailed price data (7d/30d changes), add this helper:

```javascript
async enhanceWithPriceData(holdings) {
    // Get CoinGecko IDs for tokens (map symbol to coingecko id)
    const symbolToCoinGeckoId = {
        'ETH': 'ethereum',
        'MATIC': 'matic-network',
        'BNB': 'binancecoin',
        'AVAX': 'avalanche-2',
        'ARB': 'arbitrum',
        'OP': 'optimism',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'UNI': 'uniswap',
        'AAVE': 'aave',
        'LINK': 'chainlink'
        // Add more as needed
    };

    const coinIds = [...new Set(
        holdings
            .map(h => symbolToCoinGeckoId[h.token])
            .filter(Boolean)
    )];

    if (coinIds.length === 0) return holdings;

    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24h_change=true&include_7d_change=true&include_30d_change=true`
        );

        const prices = await response.json();

        // Enhance holdings with detailed price data
        return holdings.map(holding => {
            const coinId = symbolToCoinGeckoId[holding.token];
            const priceData = prices[coinId];

            if (priceData) {
                return {
                    ...holding,
                    change7d: priceData.usd_7d_change || 0,
                    change30d: priceData.usd_30d_change || 0,
                    priceUsd: priceData.usd
                };
            }

            return holding;
        });
    } catch (error) {
        console.warn('CoinGecko price enhancement failed:', error);
        return holdings;  // Return original data on error
    }
}
```

### Step 5: Update UI to Show Enhanced Data

Add this to your holdings table rendering (if using enhanced prices):

```javascript
renderHoldingsTable() {
    // ... existing code ...

    filtered.forEach(holding => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="token-cell">
                    ${holding.logo ?
                        `<img src="${holding.logo}" class="token-icon-large" onerror="this.style.display='none'">` :
                        `<div class="token-icon-large">${holding.token.slice(0, 3)}</div>`
                    }
                    <div class="token-info">
                        <div class="token-name">${holding.name}</div>
                        <div class="token-symbol">${holding.token}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="chain-badge">
                    ${holding.chain.charAt(0).toUpperCase() + holding.chain.slice(1)}
                </span>
            </td>
            <td class="balance-cell">${formatNumber(parseFloat(holding.balance), 4)} ${holding.token}</td>
            <td class="value-cell">${formatCurrency(holding.value)}</td>
            <td>
                <div class="change-cell ${holding.change24h >= 0 ? 'change-positive' : 'change-negative'}">
                    ${holding.change24h >= 0 ? '+' : ''}${holding.change24h.toFixed(2)}%
                    ${holding.change7d !== undefined ?
                        `<div style="font-size: 0.85em; opacity: 0.7">7d: ${holding.change7d >= 0 ? '+' : ''}${holding.change7d.toFixed(2)}%</div>`
                        : ''
                    }
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}
```

---

## 🔐 SECURITY: Protecting Your API Keys

**⚠️ CRITICAL**: Never expose API keys in client-side code for production!

### Development (Client-Side) ✅
```javascript
// OK for testing/development
const MORALIS_API_KEY = 'YOUR_KEY_HERE';
```

### Production (Backend Proxy) ⚡
```javascript
// Create backend endpoint: /api/portfolio/:address
app.get('/api/portfolio/:address', async (req, res) => {
    const { address } = req.params;

    const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?chain=eth&chain=polygon`,
        {
            headers: {
                'X-API-Key': process.env.MORALIS_API_KEY,  // Secure!
                'accept': 'application/json'
            }
        }
    );

    const data = await response.json();
    res.json(data);
});

// In your widget:
const response = await fetch(`/api/portfolio/${walletAddress}`);
```

---

## 📊 API COST CALCULATOR

### Scenario: 1,000 Active Users

**Assumptions**:
- Each user loads portfolio: 3 times/day
- Average portfolio size: 10 tokens
- Monthly active users: 1,000

**API Calls Per Month**:
```
Moralis API:
- Portfolio loads: 1,000 users × 3 loads/day × 30 days = 90,000 calls/month
- Free tier: 40,000 calls ❌ EXCEEDED
- Pro tier ($49/mo): 3,000,000 calls ✅ PLENTY

CoinGecko API (if using):
- Price updates: 1 call per portfolio load = 90,000 calls/month
- Free tier: 10,000 calls ❌ EXCEEDED
- Analyst tier ($129/mo): 500,000 calls ✅ PLENTY
```

**Total Monthly Cost**:
- **Small scale** (<500 users): $0 (free tiers)
- **Medium scale** (1K-10K users): $49/month (Moralis Pro only)
- **Large scale** (10K+ users): $178/month (Moralis Pro + CoinGecko Analyst)

---

## 🚀 ALTERNATIVE OPTION B: Alchemy SDK

**Best for**: If you already have Alchemy account or need NFT data too

**Pricing**:
- Free tier: 300M compute units/month
- Growth: $49/month - 3B compute units

**Code Example**:
```javascript
import { Alchemy, Network } from 'alchemy-sdk';

const alchemy = new Alchemy({
    apiKey: 'YOUR_ALCHEMY_API_KEY',
    network: Network.ETH_MAINNET
});

// Get token balances for wallet
const balances = await alchemy.core.getTokenBalances(walletAddress);

// Get token metadata
for (const token of balances.tokenBalances) {
    const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
    console.log(`${metadata.symbol}: ${token.tokenBalance}`);
}
```

**Multi-Chain with Alchemy**:
```javascript
// Must create separate Alchemy instance per chain
const chains = [
    { network: Network.ETH_MAINNET, name: 'ethereum' },
    { network: Network.MATIC_MAINNET, name: 'polygon' },
    { network: Network.ARB_MAINNET, name: 'arbitrum' }
];

const allBalances = await Promise.all(
    chains.map(async ({ network, name }) => {
        const alchemy = new Alchemy({ apiKey: 'YOUR_KEY', network });
        const balances = await alchemy.core.getTokenBalances(walletAddress);
        return { chain: name, balances };
    })
);
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### Phase 1: Basic Real Data (1-2 hours)
- [ ] Sign up for Moralis account
- [ ] Get Moralis API key
- [ ] Replace mock data in `loadPortfolio()` function
- [ ] Test with real wallet address
- [ ] Verify token balances match MetaMask

### Phase 2: Enhanced Pricing (30 mins)
- [ ] Optional: Sign up for CoinGecko API
- [ ] Add `enhanceWithPriceData()` function
- [ ] Update UI to show 7d/30d changes
- [ ] Test price data accuracy

### Phase 3: Production Security (1 hour)
- [ ] Create backend API proxy
- [ ] Move API keys to environment variables
- [ ] Update widget to call backend endpoint
- [ ] Add rate limiting

### Phase 4: Optimization (2 hours)
- [ ] Add caching (localStorage, 5-minute TTL)
- [ ] Implement loading states
- [ ] Add error handling with retry logic
- [ ] Performance testing

---

## 📚 API DOCUMENTATION LINKS

### Moralis
- **Main Docs**: https://docs.moralis.io/web3-data-api
- **Wallet API**: https://docs.moralis.io/web3-data-api/evm/reference/wallet-api
- **Get Tokens**: https://docs.moralis.io/web3-data-api/evm/reference/get-wallet-token-balances
- **Rate Limits**: https://docs.moralis.io/web3-data-api/evm/rate-limits

### CoinGecko
- **API Docs**: https://www.coingecko.com/api/documentations/v3
- **Simple Price**: https://docs.coingecko.com/reference/simple-price
- **Token Price**: https://docs.coingecko.com/reference/simple-token-price-id
- **Pricing Plans**: https://www.coingecko.com/en/api/pricing

### Alchemy
- **SDK Docs**: https://docs.alchemy.com/reference/alchemy-sdk-quickstart
- **Token Balances**: https://docs.alchemy.com/reference/alchemy-gettokenbalances
- **Pricing**: https://www.alchemy.com/pricing

### Ethers.js
- **Main Docs**: https://docs.ethers.org/v6/
- **Providers**: https://docs.ethers.org/v6/api/providers/
- **Contracts**: https://docs.ethers.org/v6/api/contract/

---

## ⚡ QUICK START (Copy-Paste Ready)

```javascript
// 1. Add this to top of portfolio.html <script> section:
const MORALIS_API_KEY = 'YOUR_MORALIS_API_KEY_HERE';
const SUPPORTED_CHAINS = ['eth', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche'];

// 2. Replace entire loadPortfolio() function with:
async loadPortfolio() {
    if (!this.walletAddress) {
        console.warn('No wallet connected');
        this.holdings = [];
        return;
    }

    showNotification('Loading portfolio...', 'info', 5000);

    try {
        const chainQuery = SUPPORTED_CHAINS.map(c => `chain=${c}`).join('&');
        const response = await fetch(
            `https://deep-index.moralis.io/api/v2.2/wallets/${this.walletAddress}/tokens?${chainQuery}`,
            { headers: { 'X-API-Key': MORALIS_API_KEY, 'accept': 'application/json' } }
        );

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();

        this.holdings = data.tokens
            .filter(t => parseFloat(t.balance) > 0 && !t.possible_spam)
            .map(t => ({
                token: t.symbol,
                name: t.name,
                chain: t.chain,
                balance: ethers.formatUnits(t.balance, t.decimals),
                value: parseFloat(t.usd_value) || 0,
                change24h: parseFloat(t.usd_price_24hr_percent_change) || 0,
                logo: t.logo,
                contractAddress: t.token_address
            }))
            .sort((a, b) => b.value - a.value);

        showNotification(`Portfolio loaded: ${this.holdings.length} tokens`, 'success');
        this.renderPortfolio();

    } catch (error) {
        console.error('Portfolio load failed:', error);
        showNotification('Failed to load portfolio: ' + error.message, 'error');
        this.holdings = [];
    }
}

// 3. Done! Test by connecting wallet and clicking refresh
```

---

## 🎉 RESULT

After implementation, your Portfolio widget will:

✅ **Show REAL wallet balances** across 6 blockchains
✅ **Display LIVE USD values** for all tokens
✅ **Track 24h price changes** with color indicators
✅ **Filter spam tokens** automatically
✅ **Load in <2 seconds** (with caching: <500ms)
✅ **Update on demand** via refresh button
✅ **Support 180+ networks** (via Moralis)

**Total Implementation Time**: 2-4 hours (including testing)
**Total Monthly Cost**: $0-49 (for up to 100K portfolio loads)

---

## 💬 Need Help?

**Issues**:
- Moralis API: https://forum.moralis.io/
- CoinGecko API: support@coingecko.com
- Alchemy: https://docs.alchemy.com/docs/get-help

**Testing Tools**:
- Ethereum Mainnet RPC: https://eth.llamarpc.com
- Test wallet: `vitalik.eth` (0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045)

---

**Built with 💪 by the BroFit team**
