# 🚀 BroFit Widget Embed Codes for Docusaurus

**Status**: ✅ All 5 widgets tested and verified
**Verification Date**: 2025-10-20

---

## Copy-Paste Ready Iframe Codes

### 1. 🏠 **Dashboard Home**

**What it does**: Portfolio overview, quick actions, recent activity, top holdings

**Direct Link**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard

**Embed Code for Docusaurus (.mdx file)**:
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

### 2. 🔄 **Swap Widget**

**What it does**: Token swapping across 10+ chains (Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, etc.)

**Direct Link**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/swap

**Embed Code for Docusaurus (.mdx file)**:
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

### 3. 🌉 **Bridge Widget**

**What it does**: Cross-chain bridging - move tokens between different blockchains

**Direct Link**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/bridge

**Embed Code for Docusaurus (.mdx file)**:
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

### 4. 💼 **Portfolio Widget**

**What it does**: Multi-chain portfolio tracker showing all token holdings

**Direct Link**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/portfolio

**Embed Code for Docusaurus (.mdx file)**:
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

### 5. 📜 **History Widget**

**What it does**: Transaction history for all swaps and bridges

**Direct Link**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app/dashboard/history

**Embed Code for Docusaurus (.mdx file)**:
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

## 🎨 Customization

### Change Height
```jsx
height="600"  // Compact
height="700"  // Default (recommended)
height="900"  // Extended
```

### Remove Green Border
```jsx
style={{ borderRadius: '12px', marginTop: '20px' }}
```

### Add Shadow
```jsx
style={{
  border: '2px solid #3EB85F',
  borderRadius: '12px',
  marginTop: '20px',
  boxShadow: '0 4px 12px rgba(62, 184, 95, 0.2)'
}}
```

---

## ✅ Verification Results

All widgets tested with Playwright E2E:

| Widget | Status | Direct Access | CORS | X-Frame-Options | Embedding |
|--------|--------|---------------|------|-----------------|-----------|
| Dashboard | ✅ | 200 OK | ✅ Allow All | ✅ Not Set | ✅ Works |
| Swap | ✅ | 200 OK | ✅ Allow All | ✅ Not Set | ✅ Works |
| Bridge | ✅ | 200 OK | ✅ Allow All | ✅ Not Set | ✅ Works |
| Portfolio | ✅ | 200 OK | ✅ Allow All | ✅ Not Set | ✅ Works |
| History | ✅ | 200 OK | ✅ Allow All | ✅ Not Set | ✅ Works |

**Success Rate**: 5/5 (100%) ✅

---

## 📋 Quick Reference Table

| Widget | URL Path | Recommended Height | Key Feature |
|--------|----------|-------------------|-------------|
| 🏠 Dashboard | `/dashboard` | 700px | Portfolio overview |
| 🔄 Swap | `/dashboard/swap` | 700px | Multi-chain swaps |
| 🌉 Bridge | `/dashboard/bridge` | 700px | Cross-chain bridge |
| 💼 Portfolio | `/dashboard/portfolio` | 700px | Holdings tracker |
| 📜 History | `/dashboard/history` | 700px | Transaction history |

**Base URL**: `https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app`

---

## 🆘 Need Help?

- **Full Documentation**: See `DOCUSAURUS-EMBEDDING.md`
- **GitHub**: https://github.com/ForkIt369/brofit-native-swap
- **Live Demo**: https://brofit-native-swap-g0blpjmib-will31s-projects.vercel.app
