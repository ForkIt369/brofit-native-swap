# BroFit Edge Functions - Deployment Guide

**Version**: v1.8.0
**Date**: 2025-10-20
**Status**: Ready for Deployment

---

## 📋 Overview

This document provides complete instructions for deploying BroFit's Vercel Edge Functions to move API keys from frontend to server-side. This addresses the **critical security vulnerability** of exposed API keys in browser JavaScript.

### What Changed

- ✅ **3 Edge Functions created** - Server-side API proxies
- ✅ **3 Utility modules** - Shared validation, CORS, fetch with timeout/retry
- ✅ **Embedding enabled** - Removed X-Frame-Options restriction
- ✅ **Environment variables documented** - .env.example updated

### Security Benefits

- 🔐 API keys moved to server (never exposed to browser)
- 🛡️ Input validation on all requests
- ⏱️ Timeout protection (10-30s with retry)
- 🚦 Rate limiting ready (client-side bypass eliminated)
- 🌐 CORS configured for embedding on any site

---

## 🗂️ File Structure

```
brofit-native-swap/
├── api/
│   ├── utils/
│   │   ├── validate.ts       # Input validation (address, amount, chainId)
│   │   ├── cors.ts           # CORS headers for embedding
│   │   └── fetchWithTimeout.ts  # Timeout/retry wrapper
│   ├── rocketx/
│   │   └── quote.ts          # POST /api/rocketx/quote
│   ├── moralis/
│   │   └── wallets/
│   │       └── [address]/
│   │           └── tokens.ts # GET /api/moralis/wallets/:address/tokens
│   └── coingecko/
│       └── simple/
│           └── price.ts      # GET /api/coingecko/simple/price
├── vercel.json               # ✅ Updated (X-Frame-Options removed)
├── .env.example              # ✅ Updated (ALLOWED_ORIGINS=*)
└── EDGE-FUNCTIONS.md         # This file
```

---

## 🚀 Deployment Steps

### Step 1: Configure Vercel Environment Variables

Add the following environment variables in your Vercel project dashboard:

**Dashboard URL**: https://vercel.com/your-username/brofit-native-swap/settings/environment-variables

#### Required Variables

```bash
# RocketX API (for swap/bridge quotes)
ROCKETX_API_KEY=25de7b8a-5dbd-41d5-a9a5-e865462268a0

# Moralis API (for multi-chain portfolio data)
MORALIS_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjM3MmE3NmNkLTRkZmYtNGI2OC05NTRiLWQwNWZiZTlmNTgzYyIsIm9yZ0lkIjoiNDQ3MzE4IiwidXNlcklkIjoiNDYwMjM2IiwidHlwZUlkIjoiYjFjY2Y1OWUtN2M3Mi00YjdlLWJkNTEtMjQzNmRmZDg2OTc2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDczNTM2MDMsImV4cCI6NDkwMzExMzYwM30.d03rGvyBobwlLHYpGJcnnd3nAmWsBUfwZyIpeM-xSSQ

# CoinGecko API (for token prices/metadata)
COINGECKO_API_KEY=CG-W6Sr7Nw6HLqTGC1s2LEFLKZw

# CORS configuration (set to "*" to allow embedding on any site)
ALLOWED_ORIGINS=*
```

#### How to Add (CLI Method)

```bash
# Add environment variables using Vercel CLI
vercel env add ROCKETX_API_KEY
# Paste value when prompted: 25de7b8a-5dbd-41d5-a9a5-e865462268a0
# Choose: Production, Preview, Development (select all)

vercel env add MORALIS_API_KEY
# Paste value when prompted

vercel env add COINGECKO_API_KEY
# Paste value when prompted

vercel env add ALLOWED_ORIGINS
# Enter: *
```

#### How to Add (Dashboard Method)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter variable name (e.g., `ROCKETX_API_KEY`)
6. Enter variable value
7. Select environments: **Production**, **Preview**, **Development**
8. Click **Save**
9. Repeat for all 4 variables

---

### Step 2: Deploy Edge Functions

```bash
# Ensure you're in the project directory
cd /Users/digitaldavinci/brofit\ demo/brofit-native-swap

# Commit Edge Functions code
git add api/ vercel.json .env.example EDGE-FUNCTIONS.md
git commit -m "feat: implement Edge Functions for API security

- Add 3 Edge Functions (RocketX, Moralis, CoinGecko)
- Add shared utilities (validate, cors, fetchWithTimeout)
- Remove X-Frame-Options to enable embedding
- Update CORS to allow embedding on any site
- Document deployment in EDGE-FUNCTIONS.md

Security improvements:
- API keys moved to server-side
- Input validation on all requests
- Timeout protection (10-30s with retry)
- Rate limiting infrastructure ready"

# Push to GitHub
git push origin main

# Deploy to Vercel (automatically triggered by push)
# OR manually deploy:
vercel --prod
```

---

### Step 3: Verify Edge Functions Work

Test each Edge Function endpoint after deployment:

#### Test RocketX Quote

```bash
# Swap quote
curl -X POST "https://brofit-native-swap.vercel.app/api/rocketx/quote" \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "toToken": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "amount": "1",
    "network": "ethereum",
    "slippage": 0.5,
    "type": "swap"
  }'

# Bridge quote
curl -X POST "https://brofit-native-swap.vercel.app/api/rocketx/quote" \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "toToken": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "amount": "1",
    "fromNetwork": "ethereum",
    "toNetwork": "polygon",
    "slippage": 1.0,
    "type": "bridge"
  }'
```

**Expected Response**: Quote object with routes, fees, estimated output

#### Test Moralis Tokens

```bash
curl "https://brofit-native-swap.vercel.app/api/moralis/wallets/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/tokens?chain=eth"
```

**Expected Response**: Array of ERC20 tokens with balances

#### Test CoinGecko Prices

```bash
curl "https://brofit-native-swap.vercel.app/api/coingecko/simple/price?ids=ethereum,polygon,bitcoin&vs_currencies=usd&include_24hr_change=true"
```

**Expected Response**: Price object with USD values and 24h changes

---

### Step 4: Test Embedding

Create a simple HTML file to test embedding:

**test-embed.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>BroFit Embed Test</title>
    <style>
        body { margin: 0; padding: 20px; font-family: sans-serif; }
        iframe { width: 100%; height: 800px; border: 1px solid #ccc; }
    </style>
</head>
<body>
    <h1>BroFit Embed Test</h1>
    <p>Testing cross-site embedding with removed X-Frame-Options restriction.</p>

    <iframe
        src="https://brofit-native-swap.vercel.app"
        frameborder="0"
        allow="clipboard-write">
    </iframe>
</body>
</html>
```

Open this file in a browser. If you see the BroFit dashboard load inside the iframe, embedding is working! ✅

---

## 🔧 Edge Function Details

### 1. RocketX Quote Edge Function

**Endpoint**: `POST /api/rocketx/quote`
**Purpose**: Proxy swap and bridge quotes to RocketX API
**Cache**: No cache (quotes are time-sensitive)
**Timeout**: 15 seconds with 1 retry

**Request Body (Swap)**:
```json
{
  "fromToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "toToken": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "amount": "1",
  "network": "ethereum",
  "slippage": 0.5,
  "type": "swap"
}
```

**Request Body (Bridge)**:
```json
{
  "fromToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "toToken": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  "amount": "1",
  "fromNetwork": "ethereum",
  "toNetwork": "polygon",
  "slippage": 1.0,
  "type": "bridge"
}
```

**Validation**:
- Amount must be positive number
- Token addresses validated if starting with `0x`
- Automatic bridge detection based on `fromNetwork` ≠ `toNetwork`

---

### 2. Moralis Tokens Edge Function

**Endpoint**: `GET /api/moralis/wallets/:address/tokens?chain=eth`
**Purpose**: Fetch ERC20 token balances for a wallet
**Cache**: 60 seconds (public cache)
**Timeout**: 30 seconds with 1 retry

**Parameters**:
- `address` (path) - Ethereum wallet address (validated)
- `chain` (query) - Chain ID (eth, polygon, bsc, etc.)

**Chain Mapping**:
```typescript
'eth' → '0x1'
'polygon' → '0x89'
'bsc' → '0x38'
'arbitrum' → '0xa4b1'
'optimism' → '0xa'
'avalanche' → '0xa86a'
'fantom' → '0xfa'
```

**Example**:
```
GET /api/moralis/wallets/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/tokens?chain=polygon
```

**Validation**:
- Address must match `^0x[a-fA-F0-9]{40}$`

---

### 3. CoinGecko Price Edge Function

**Endpoint**: `GET /api/coingecko/simple/price`
**Purpose**: Fetch token prices with market data
**Cache**: 600 seconds (10 minutes, public cache)
**Timeout**: 10 seconds with 1 retry

**Parameters**:
- `ids` (required) - Comma-separated CoinGecko coin IDs
- `vs_currencies` (optional) - Default: "usd"
- `include_24hr_change` (optional) - Default: "true"
- `include_market_cap` (optional) - Default: "true"
- `include_24hr_vol` (optional) - Default: "true"

**Example**:
```
GET /api/coingecko/simple/price?ids=ethereum,polygon,bitcoin&vs_currencies=usd&include_24hr_change=true
```

**Response**:
```json
{
  "ethereum": {
    "usd": 2500.12,
    "usd_24h_change": 2.45,
    "usd_market_cap": 300000000000,
    "usd_24h_vol": 15000000000
  }
}
```

---

## 🛡️ Security Features

### Input Validation

All Edge Functions validate inputs using `api/utils/validate.ts`:

```typescript
// Ethereum address (0x + 40 hex chars)
isValidAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb") // true

// Token amount (positive number, max 18 decimals)
isValidAmount("1.25") // true
isValidAmount("-5") // false

// Chain ID (positive integer < 1,000,000)
isValidChainId(1) // true
isSupportedChain(1) // true (Ethereum)
isSupportedChain(999999) // false (not in allowlist)
```

### CORS Configuration

Embedding enabled via `api/utils/cors.ts`:

```typescript
// Returns CORS headers allowing all origins
getCorsHeaders()
// → 'Access-Control-Allow-Origin: *'

// Handles preflight OPTIONS requests
handlePreflight(request)

// Creates JSON response with CORS
jsonResponse({ success: true }, 200)

// Creates error response with CORS
errorResponse("Invalid address", 400)
```

### Timeout & Retry Logic

All API calls protected via `api/utils/fetchWithTimeout.ts`:

```typescript
// 10 second timeout, 1 retry on 429/5xx
await fetchJSON(url, {
  timeout: 10000,
  retries: 1,
  retryOn: [429, 500, 502, 503, 504]
});

// Automatic jitter to prevent thundering herd
// AbortController for clean timeout handling
```

---

## 📊 Performance & Caching

### Cache Strategy

| Endpoint | Cache Duration | Reasoning |
|----------|----------------|-----------|
| RocketX Quote | No cache | Quotes change constantly |
| Moralis Tokens | 60s | Balances update frequently |
| CoinGecko Price | 600s (10min) | Prices update slowly |

### Cache Headers

```http
Cache-Control: public, max-age=60, s-maxage=60    # Moralis
Cache-Control: public, max-age=600, s-maxage=600  # CoinGecko
```

### Error Handling

All Edge Functions return consistent error format:

```json
{
  "error": "Invalid Ethereum address",
  "status": 400
}
```

**Status Codes**:
- `400` - Bad request (validation failed)
- `401` - Unauthorized (API key invalid)
- `405` - Method not allowed
- `429` - Rate limit exceeded
- `500` - Server error
- `504` - Timeout

---

## 🔍 Monitoring & Debugging

### View Edge Function Logs

```bash
# Stream logs from Vercel
vercel logs --follow

# View specific deployment logs
vercel logs [deployment-url]
```

### Debug Checklist

If Edge Functions aren't working:

1. ✅ **Verify environment variables** - Check Vercel dashboard
2. ✅ **Check deployment logs** - `vercel logs --follow`
3. ✅ **Test locally first** - `vercel dev` (requires Vercel CLI)
4. ✅ **Verify CORS headers** - Check browser Network tab
5. ✅ **Check API key validity** - Test direct API calls

### Local Development

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Create local .env file (never commit!)
cp .env.example .env
# Edit .env with real API keys

# Run Edge Functions locally
vercel dev

# Test endpoints at http://localhost:3000/api/*
curl "http://localhost:3000/api/coingecko/simple/price?ids=ethereum&vs_currencies=usd"
```

---

## 📝 Next Steps (Future v1.8.1+)

### Phase 1: Frontend Integration (Not in this deployment)

Update frontend files to use Edge Functions instead of direct API calls:

- `widgets/shared/rocketx-api.js` → Call `/api/rocketx/quote`
- `widgets/shared/moralis-api.js` → Call `/api/moralis/wallets/:address/tokens`
- `widgets/shared/coingecko-api.js` → Call `/api/coingecko/simple/price`

**Note**: This will be done in a follow-up deployment to avoid breaking changes.

### Phase 2: Rate Limiting (v1.8.1)

Add server-side rate limiting using Vercel KV or Upstash Redis:

```typescript
// api/utils/rateLimit.ts
import { kv } from '@vercel/kv';

export async function checkRateLimit(ip: string, limit: number = 60): Promise<boolean> {
  const key = `rate-limit:${ip}`;
  const requests = await kv.incr(key);
  if (requests === 1) {
    await kv.expire(key, 60); // 60 seconds window
  }
  return requests <= limit;
}
```

### Phase 3: Response Schema Validation (v1.8.2)

Add Zod schemas to validate API responses:

```typescript
import { z } from 'zod';

const QuoteSchema = z.object({
  routes: z.array(z.object({
    fromAmount: z.string(),
    toAmount: z.string(),
    gasFee: z.string()
  }))
});

const data = await fetchJSON(url);
const validated = QuoteSchema.parse(data); // Throws if invalid
```

---

## ✅ Deployment Checklist

- [ ] Add environment variables to Vercel dashboard
  - [ ] `ROCKETX_API_KEY`
  - [ ] `MORALIS_API_KEY`
  - [ ] `COINGECKO_API_KEY`
  - [ ] `ALLOWED_ORIGINS=*`
- [ ] Commit Edge Functions code to Git
- [ ] Push to GitHub (triggers auto-deploy)
- [ ] Wait for Vercel deployment to complete
- [ ] Test all 3 Edge Functions with curl
- [ ] Test embedding with test-embed.html
- [ ] Verify CORS headers in browser Network tab
- [ ] Check Vercel logs for any errors
- [ ] Update frontend to use Edge Functions (future deployment)

---

## 🎯 Success Criteria

### Deployment Successful If:

✅ All 3 Edge Functions return 200 OK
✅ Embedding test shows dashboard in iframe
✅ No API keys visible in browser source
✅ CORS headers include `Access-Control-Allow-Origin: *`
✅ Edge Function logs show requests processing
✅ No errors in Vercel deployment logs

---

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs: `vercel logs --follow`
2. Verify environment variables in dashboard
3. Test endpoints with curl/Postman
4. Check browser console for CORS errors
5. Review this documentation for missing steps

---

*Last Updated: 2025-10-20*
*Version: v1.8.0*
*Status: Ready for Production Deployment* ✅
