# BroFit Deployment Guide

**Version**: v1.5.0
**Date**: October 17, 2025

## 🚀 Quick Start

### Local Testing
```bash
cd "/Users/digitaldavinci/brofit demo/brofit-native-swap"

# Option 1: Python HTTP Server
python3 -m http.server 8080

# Option 2: PHP Built-in Server
php -S localhost:8080

# Option 3: Node.js http-server
npx http-server -p 8080
```

Then open: `http://localhost:8080/index.html`

---

## 📦 What's New in v1.5.0

### New Files
```
widgets/shared/
├── token-icons.js      (12 KB) - Multi-source token icon loader
├── coingecko-api.js    (15 KB) - CoinGecko API integration
└── moralis-api.js      (16 KB) - Moralis Web3 API wrapper
```

### Updated Files
```
index.html              - Added API module script tags + CBO animations
widgets/portfolio.html  - Integrated new APIs + token icon system
js/dashboard.js         - Added CBO loading overlays + API wrappers
```

### New Features
- ✅ 4-tier token icon fallback system
- ✅ CoinGecko API integration with rate limiting
- ✅ Moralis multi-chain portfolio tracking
- ✅ CBO avatar loading states
- ✅ Progressive icon loading
- ✅ Enhanced error handling

---

## 🧪 Testing Checklist

### Before Deployment

#### 1. API Connectivity
- [ ] Open browser console
- [ ] Connect MetaMask wallet
- [ ] Check for API errors in console
- [ ] Verify token icons load
- [ ] Verify portfolio data loads

#### 2. Token Icons
- [ ] Major tokens (ETH, USDT, USDC) show real logos
- [ ] Unknown tokens show gradient placeholders
- [ ] Icons load progressively (placeholder → real icon)
- [ ] No broken image icons

#### 3. CBO Avatars
- [ ] Loading overlay shows `cbo_processing_watch.png`
- [ ] Error overlay shows `cbo_cautious_reviewing.png`
- [ ] Empty states show `cbo_welcome_open_arms.png`
- [ ] All avatars load with ?v=2 cache buster

#### 4. Portfolio Widget
- [ ] Loads wallet tokens across chains
- [ ] Shows correct token balances
- [ ] Displays USD values
- [ ] Chain filter works
- [ ] Search filter works
- [ ] Export CSV works

#### 5. Dashboard
- [ ] Total portfolio value updates
- [ ] Active chains count correct
- [ ] Top holdings display
- [ ] Recent activity section (when available)
- [ ] Navigation between widgets works

---

## 🔑 API Configuration

### Required API Keys (Already Configured)

#### Moralis API
```javascript
API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
BASE_URL: 'https://deep-index.moralis.io/api/v2.2'
STATUS: ✅ Active
PLAN: Project
```

#### CoinGecko API
```javascript
API_KEY: 'CG-W6Sr7Nw6HLqTGC1s2LEFLKZw'
BASE_URL: 'https://api.coingecko.com/api/v3'
STATUS: ✅ Active
PLAN: Demo (30 req/min, 10K/month)
RATE_LIMIT: 30 requests/minute
```

#### Trust Wallet Assets
```javascript
BASE_URL: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/'
STATUS: ✅ Always Available
RATE_LIMIT: None
```

#### jsDelivr CDN
```javascript
BASE_URL: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/'
STATUS: ✅ Always Available
RATE_LIMIT: None
```

---

## 🌐 Production Deployment

### Option 1: Static Hosting (Recommended)

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd "/Users/digitaldavinci/brofit demo/brofit-native-swap"
vercel --prod

# Custom domain (optional)
vercel domains add brofit.yourdomain.com
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd "/Users/digitaldavinci/brofit demo/brofit-native-swap"
netlify deploy --prod

# Custom domain (optional)
netlify domains:add brofit.yourdomain.com
```

#### GitHub Pages
```bash
# Create gh-pages branch
git checkout -b gh-pages
git add .
git commit -m "Deploy BroFit v1.5.0"
git push origin gh-pages

# Enable in repo settings > Pages
# URL: https://yourusername.github.io/brofit/
```

### Option 2: VPS/Cloud Server

#### Requirements
- Node.js 18+ OR PHP 8+ OR Python 3+
- Nginx/Apache (optional, for routing)
- SSL certificate (Let's Encrypt recommended)

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name brofit.yourdomain.com;

    root /var/www/brofit;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional)
    location /api/ {
        proxy_pass https://deep-index.moralis.io/;
        proxy_set_header X-API-Key $moralis_api_key;
    }

    # Caching headers
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔒 Security Recommendations

### For Production

#### 1. Environment Variables
Move API keys to environment variables:

```javascript
// Instead of:
const API_KEY = 'CG-W6Sr7Nw6HLqTGC1s2LEFLKZw';

// Use:
const API_KEY = process.env.COINGECKO_API_KEY || '';
```

#### 2. API Proxy (Recommended)
Create backend proxy to hide API keys:

```javascript
// Backend endpoint
app.get('/api/portfolio/:address', async (req, res) => {
    const address = req.params.address;
    const data = await moralis.getPortfolio(address);
    res.json(data);
});

// Frontend call
const data = await fetch('/api/portfolio/' + address);
```

#### 3. Rate Limiting
Add server-side rate limiting:

```javascript
// Express.js example
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30 // 30 requests per minute
});

app.use('/api/', limiter);
```

#### 4. CORS Configuration
Configure CORS for production:

```javascript
// Allow only your domain
const cors = require('cors');
app.use(cors({
    origin: 'https://brofit.yourdomain.com'
}));
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Token Icons Not Loading
**Symptom**: Blank icons or placeholders only
**Solution**:
```javascript
// Check browser console for errors
// Clear localStorage cache
localStorage.clear();

// Verify Trust Wallet URL
console.log(getTrustWalletUrl('eth', '0x...'));

// Check cache stats
console.log(getIconCacheStats());
```

#### 2. Portfolio Data Not Loading
**Symptom**: Empty portfolio or "No wallet connected"
**Solution**:
```javascript
// Check Moralis API key
console.log(MORALIS_CONFIG.API_KEY);

// Test API directly
fetch('https://deep-index.moralis.io/api/v2.2/wallets/0x.../tokens?chain=eth', {
    headers: { 'X-API-Key': MORALIS_CONFIG.API_KEY }
})
.then(r => r.json())
.then(console.log);

// Clear Moralis cache
clearMoralisCache();
```

#### 3. CoinGecko Rate Limit
**Symptom**: "Rate limit exceeded" errors
**Solution**:
```javascript
// Check rate limiter status
console.log(rateLimiter.requests.length);

// Wait 60 seconds and retry
setTimeout(() => getTokenInfo('ETH'), 60000);

// Increase cache duration
COINGECKO_CONFIG.CACHE_DURATION = 10 * 60 * 1000; // 10 min
```

#### 4. CBO Avatars Not Loading
**Symptom**: Broken image icons for CBO
**Solution**:
```javascript
// Verify Supabase storage URL
const baseUrl = 'https://imqpmvkloxoxibbrwwef.supabase.co/storage/v1/object/public/avatars/';
console.log(baseUrl + 'cbo/cbo_processing_watch.png?v=2');

// Update cache buster version
// Change ?v=2 to ?v=3 in all avatar URLs
```

#### 5. Wallet Connection Issues
**Symptom**: "Failed to connect wallet"
**Solution**:
```javascript
// Check MetaMask installation
if (!window.ethereum) {
    console.error('MetaMask not installed');
}

// Check network
window.ethereum.request({ method: 'eth_chainId' })
    .then(console.log);

// Reset wallet connection
localStorage.removeItem('brofit_connected_wallet');
```

---

## 📊 Performance Monitoring

### Key Metrics to Track

#### API Response Times
```javascript
// Log in browser console
console.time('portfolio-load');
await loadPortfolioData(address);
console.timeEnd('portfolio-load');
// Target: < 3 seconds
```

#### Cache Hit Rate
```javascript
// Token icons
getIconCacheStats();
// Target: > 90%

// CoinGecko
getCoinGeckoCacheStats();
// Target: > 85%

// Moralis
getMoralisCacheStats();
// Target: > 70%
```

#### Memory Usage
```javascript
// Chrome DevTools > Performance Monitor
// Watch for memory leaks
// Target: < 100 MB
```

---

## 🔄 Rollback Plan

### If Issues Arise

#### Option 1: Quick Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or restore from backup
cp -r backup-v1.4.0/* .
```

#### Option 2: Disable New Features
```html
<!-- Comment out new API scripts -->
<!-- <script src="widgets/shared/token-icons.js"></script> -->
<!-- <script src="widgets/shared/coingecko-api.js"></script> -->
<!-- <script src="widgets/shared/moralis-api.js"></script> -->
```

---

## 📞 Support

### Debug Mode
Enable verbose logging:
```javascript
// In browser console
localStorage.setItem('brofit_debug', 'true');
location.reload();
```

### Log Files
Check browser console for:
- API errors
- Network failures
- Cache statistics
- Loading times

### Contact
- GitHub Issues: [Create Issue](https://github.com/yourusername/brofit/issues)
- Documentation: `INTEGRATION-SUMMARY.md`

---

## ✅ Pre-Launch Checklist

### Before Going Live
- [ ] Test with real wallet (MetaMask)
- [ ] Verify all 7 chains load data
- [ ] Test token icon fallbacks
- [ ] Check CBO avatar loading
- [ ] Test error scenarios
- [ ] Verify mobile responsiveness
- [ ] Check browser console for errors
- [ ] Test with slow network (DevTools throttling)
- [ ] Verify cache persistence
- [ ] Test export CSV functionality

### Production Readiness
- [ ] Move API keys to environment
- [ ] Set up error monitoring
- [ ] Configure CDN/caching
- [ ] Enable compression
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Set up backup/restore
- [ ] Document API endpoints
- [ ] Create runbook for ops team

---

**Ready to deploy!** 🚀

For questions, refer to `INTEGRATION-SUMMARY.md` or contact the development team.
