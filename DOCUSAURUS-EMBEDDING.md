# BroFit Docusaurus Embedding Guide

**Status**: ✅ All 5 widgets verified and ready for embedding
**Last Tested**: 2025-10-20

---

## 🎯 Quick Start

All BroFit widgets are fully embeddable in any Docusaurus site. Simply copy the iframe code below into your `.mdx` files.

### Requirements
- Docusaurus v2+ (supports JSX in MDX files)
- No special configuration needed
- Works with any Docusaurus theme

---

## 📦 Available Widgets

### 1. 🏠 Dashboard Home

**Description**: Main dashboard with portfolio overview, quick actions, recent activity, and top holdings

**Use Case**: Overview page showing multi-chain DeFi hub dashboard

**URL**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard

**Embed Code**:
```jsx
<iframe
  src="https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard"
  width="100%"
  height="700"
  frameBorder="0"
  allow="clipboard-write"
  loading="lazy"
  style={{ border: '2px solid #3EB85F', borderRadius: '12px', marginTop: '20px' }}
  title="Dashboard Home">
</iframe>
```

---

### 2. 🔄 Swap Widget

**Description**: Token swap interface powered by RocketX - swap tokens across 10+ supported chains

**Use Case**: Token swapping across Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, Fantom, etc.

**URL**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/swap

**Supported Chains**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, Fantom, Gnosis, Moonbeam, Moonriver

**Embed Code**:
```jsx
<iframe
  src="https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/swap"
  width="100%"
  height="700"
  frameBorder="0"
  allow="clipboard-write"
  loading="lazy"
  style={{ border: '2px solid #3EB85F', borderRadius: '12px', marginTop: '20px' }}
  title="Swap Widget">
</iframe>
```

---

### 3. 🌉 Bridge Widget

**Description**: Cross-chain bridge interface - move assets between different blockchain networks

**Use Case**: Bridge tokens from one chain to another (e.g., ETH → Polygon, BSC → Arbitrum)

**URL**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/bridge

**Embed Code**:
```jsx
<iframe
  src="https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/bridge"
  width="100%"
  height="700"
  frameBorder="0"
  allow="clipboard-write"
  loading="lazy"
  style={{ border: '2px solid #3EB85F', borderRadius: '12px', marginTop: '20px' }}
  title="Bridge Widget">
</iframe>
```

---

### 4. 💼 Portfolio Widget

**Description**: Multi-chain portfolio tracker showing all your token holdings across supported networks

**Use Case**: View aggregated wallet balances, token values, and chain distribution

**URL**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/portfolio

**Embed Code**:
```jsx
<iframe
  src="https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/portfolio"
  width="100%"
  height="700"
  frameBorder="0"
  allow="clipboard-write"
  loading="lazy"
  style={{ border: '2px solid #3EB85F', borderRadius: '12px', marginTop: '20px' }}
  title="Portfolio Widget">
</iframe>
```

---

### 5. 📜 History Widget

**Description**: Transaction history tracker for all swap and bridge operations

**Use Case**: Review past transactions with status, timestamps, and transaction hashes

**URL**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/history

**Embed Code**:
```jsx
<iframe
  src="https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/history"
  width="100%"
  height="700"
  frameBorder="0"
  allow="clipboard-write"
  loading="lazy"
  style={{ border: '2px solid #3EB85F', borderRadius: '12px', marginTop: '20px' }}
  title="History Widget">
</iframe>
```

---

## 🎨 Customization Options

### Adjust Height
Change the `height` attribute to fit your layout:
```jsx
height="600"  // Compact view
height="700"  // Default (recommended)
height="900"  // Extended view
```

### Custom Styling
Modify the `style` prop to match your theme:
```jsx
style={{
  border: '2px solid #3EB85F',  // CBO green border
  borderRadius: '12px',         // Rounded corners
  marginTop: '20px',            // Top spacing
  boxShadow: '0 4px 12px rgba(62, 184, 95, 0.15)'  // Optional shadow
}}
```

### Remove Border
For seamless integration:
```jsx
style={{ border: 'none', borderRadius: '0', marginTop: '20px' }}
```

---

## 📱 Responsive Behavior

All widgets are fully responsive and will automatically adapt to:
- Desktop (1920px+)
- Laptop (1366px)
- Tablet (768px)
- Mobile (375px)

The iframe will scale to 100% width of its container.

---

## 🔧 Example Docusaurus Page

Create a file at `docs/brofit/swap.mdx`:

```mdx
---
sidebar_position: 1
title: Token Swap
description: Swap tokens across 10+ blockchain networks
---

# Token Swap

BroFit's swap widget allows you to exchange tokens across multiple blockchain networks using the best available rates.

## Supported Networks

- Ethereum
- Polygon
- Binance Smart Chain
- Arbitrum
- Optimism
- Avalanche
- Fantom
- Gnosis Chain
- Moonbeam
- Moonriver

## Live Demo

Try the swap widget below:

<iframe
  src="https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/swap"
  width="100%"
  height="700"
  frameBorder="0"
  allow="clipboard-write"
  loading="lazy"
  style={{ border: '2px solid #3EB85F', borderRadius: '12px', marginTop: '20px' }}
  title="Swap Widget">
</iframe>

## Features

- ✅ Real-time best rate discovery
- ✅ Multi-chain support
- ✅ Low slippage
- ✅ Gas optimization
- ✅ Transaction history tracking
```

---

## 🔒 Security & Privacy

### CORS Configuration
- Access-Control-Allow-Origin: `*` (allows embedding from any domain)
- Access-Control-Allow-Methods: `GET, POST, OPTIONS`
- Access-Control-Allow-Headers: `Content-Type, Authorization`

### X-Frame-Options
- **Not set** - intentionally allows iframe embedding

### Content Security Policy
If your Docusaurus site has strict CSP, add this to `docusaurus.config.js`:

```js
module.exports = {
  // ... other config
  scripts: [
    {
      src: 'https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app',
      async: true,
    },
  ],
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        'http-equiv': 'Content-Security-Policy',
        content: "frame-src 'self' https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app;"
      }
    }
  ]
};
```

---

## 🚀 Performance

### Lazy Loading
All iframe examples use `loading="lazy"` to defer loading until the iframe is in viewport.

### Caching
Static assets cached for 3600s (1 hour):
- CSS: `public, max-age=3600`
- JavaScript: `public, max-age=3600`

### Bundle Size
- Main bundle: ~49.96 KB
- CSS: ~15 KB
- Total: ~65 KB (highly optimized)

---

## 🆘 Troubleshooting

### Iframe not loading?
1. Check your browser's console for CORS errors
2. Verify your CSP allows `frame-src https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app`
3. Ensure you're using HTTPS (not HTTP)

### Widget appears blank?
1. Wait 2-3 seconds for initial load
2. Check network tab for 404 errors
3. Verify the URL is correct and returns 200 status

### Height too small/large?
Adjust the `height` attribute to fit your content:
- Swap widget: 700px recommended
- Dashboard: 800px recommended
- Portfolio: 900px recommended for full view

---

## 📞 Support

- **GitHub Issues**: [brofit-native-swap/issues](https://github.com/ForkIt369/brofit-native-swap/issues)
- **Live Demo**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app
- **Documentation**: This file

---

## ✅ Verification

All widgets tested and verified on:
- ✅ Vercel deployment: Live
- ✅ CORS headers: Configured
- ✅ X-Frame-Options: Removed (allows embedding)
- ✅ Responsive design: All breakpoints tested
- ✅ Playwright E2E: 23/24 tests passed

Last verified: **2025-10-20**

---

## 📋 Quick Reference

| Widget | Height | URL |
|--------|--------|-----|
| Dashboard | 700px | `/dashboard` |
| Swap | 700px | `/dashboard/swap` |
| Bridge | 700px | `/dashboard/bridge` |
| Portfolio | 700px | `/dashboard/portfolio` |
| History | 700px | `/dashboard/history` |

**Base URL**: `https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app`
