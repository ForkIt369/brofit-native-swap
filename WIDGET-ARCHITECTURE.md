# BroFit Widget System Architecture
**Version**: 2.0.0-prototype
**Date**: 2025-10-16
**Status**: Architecture Complete → Building Phase

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    BROFIT MULTI-CHAIN WIDGET SYSTEM                         ║
║                         Prototype Architecture v2.0                         ║
╚════════════════════════════════════════════════════════════════════════════╝
```

## Executive Summary

This document outlines the architecture for expanding BroFit Native Swap from a single-chain swap interface (v1.3.0) to a comprehensive multi-chain DeFi platform with modular widget system (v2.0.0).

**Key Insight**: SWAP and BRIDGE are fundamentally different operations requiring separate UIs and state management. The ChainSelector is the foundation component that enables all other widgets.

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          WIDGET DEPENDENCY TREE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                        ┌──────────────────┐                             │
│                        │  ChainSelector   │                             │
│                        │   (Foundation)   │                             │
│                        └────────┬─────────┘                             │
│                                 │                                        │
│                 ┌───────────────┼───────────────┐                       │
│                 │               │               │                       │
│         ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐               │
│         │     Swap      │ │   Bridge   │ │ Portfolio  │               │
│         │   (Current)   │ │   (New)    │ │   (New)    │               │
│         └───────────────┘ └─────┬──────┘ └─────┬──────┘               │
│                                  │              │                       │
│                                  └──────┬───────┘                       │
│                                         │                               │
│                                  ┌──────▼──────┐                        │
│                                  │   History   │                        │
│                                  │    (New)    │                        │
│                                  └─────────────┘                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. File Structure

```
brofit-native-swap/
├── index.html                      # Main swap interface (v1.3.0 - existing)
├── gallery.html                    # Token gallery (existing)
├── widgets/
│   ├── shared/
│   │   ├── styles.css             # Shared BroHub Design System styles
│   │   ├── utils.js               # Shared utilities (Web3, API calls)
│   │   └── rocketx-api.js         # RocketX API wrapper
│   │
│   ├── chain-selector.html        # ChainSelector widget (standalone)
│   ├── bridge.html                # Bridge widget (cross-chain)
│   ├── portfolio.html             # Portfolio dashboard widget
│   ├── history.html               # Transaction history widget
│   │
│   └── gallery.html               # Widget showcase/gallery page
│
├── WIDGET-ARCHITECTURE.md         # This file
├── README.md                       # Project documentation
├── vercel.json                     # Vercel configuration
└── .gitignore                      # Git ignore rules
```

## 3. Widget Specifications

### 3.1 ChainSelector Widget (PRIORITY 1 - Foundation)

**Purpose**: Enable users to select from 180+ supported chains
**Status**: ❌ New (Critical Foundation)
**Complexity**: Medium (3-4 hours)

**Features**:
- ✅ Fetch 180+ chains from RocketX `/v1/supported-chains`
- ✅ Search and filter by chain name/ID
- ✅ Group by category (L1, L2, Sidechain)
- ✅ Show native token icon and name
- ✅ Display user balance per chain (if wallet connected)
- ✅ Visual indicators (active chain, popular chains)
- ✅ Responsive design (mobile-first)

**UI Layout**:
```
┌────────────────────────────────────────┐
│  🔍 Search chains...                   │
├────────────────────────────────────────┤
│  📊 Popular Networks                   │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │  ETH │ │ MATIC│ │  BNB │           │
│  │ $123 │ │  $45 │ │  $67 │           │
│  └──────┘ └──────┘ └──────┘           │
├────────────────────────────────────────┤
│  🏗️ Layer 1                            │
│  ○ Ethereum        $123.45             │
│  ○ Bitcoin         $0.00               │
│  ○ Solana          $89.12              │
├────────────────────────────────────────┤
│  ⚡ Layer 2                             │
│  ○ Polygon         $45.67              │
│  ○ Arbitrum        $12.34              │
│  ○ Optimism        $78.90              │
├────────────────────────────────────────┤
│  🌉 Sidechains                          │
│  ○ BNB Chain       $67.89              │
│  ○ Avalanche       $23.45              │
└────────────────────────────────────────┘
```

**Technical Specs**:
- **API Endpoint**: `GET /v1/supported-chains`
- **State Management**: localStorage for last selected chain
- **Events**: `chainSelected` custom event with chain data
- **Reusability**: Can be embedded in swap, bridge, portfolio widgets

---

### 3.2 BridgeWidget (PRIORITY 2 - Cross-Chain)

**Purpose**: Enable cross-chain token transfers
**Status**: ❌ New (Fundamentally Different from Swap)
**Complexity**: High (6-8 hours)

**Key Differences from Swap**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SWAP vs BRIDGE                                   │
├──────────────────────────────┬──────────────────────────────────────────┤
│        SWAP (Same-Chain)     │       BRIDGE (Cross-Chain)               │
├──────────────────────────────┼──────────────────────────────────────────┤
│ • 1 network                  │ • 2 networks (source + destination)      │
│ • Instant (30 seconds)       │ • 5-20 minutes                           │
│ • Single gas fee             │ • Dual gas fees (both chains)            │
│ • Simple status              │ • 3-stage status tracking                │
│ • DEX aggregation            │ • Bridge protocol selection              │
│ • Liquidity pools            │ • Locked + minted tokens                 │
└──────────────────────────────┴──────────────────────────────────────────┘
```

**Features**:
- ✅ Dual chain selectors (source → destination)
- ✅ Token selector for each chain (only bridgeable tokens)
- ✅ Bridge protocol selector (automatic vs manual)
- ✅ Time estimate display (5-20 min)
- ✅ Cross-chain gas fee breakdown
- ✅ Multi-stage progress tracking
- ✅ Slippage tolerance (higher for bridges)
- ✅ Security warnings (bridge risks)

**UI Layout**:
```
┌────────────────────────────────────────┐
│  🌉 Cross-Chain Bridge                 │
├────────────────────────────────────────┤
│  FROM Network                          │
│  [Ethereum ▼] [ETH ▼]  [1.0]          │
│  Balance: 2.5 ETH   ~$5,000            │
├────────────────────────────────────────┤
│            ⬇️ Bridge                    │
├────────────────────────────────────────┤
│  TO Network                            │
│  [Polygon ▼]  [WETH ▼] [~0.998]       │
│  Est. arrival: 5-15 min                │
├────────────────────────────────────────┤
│  📊 Bridge Details                     │
│  Protocol:      Stargate Finance       │
│  Source Gas:    ~$15.00                │
│  Bridge Fee:    ~$2.50                 │
│  Dest. Gas:     ~$0.05                 │
│  ────────────────────────────          │
│  Total Cost:    ~$17.55                │
│  You Receive:   ~$4,982.45             │
├────────────────────────────────────────┤
│  ⚠️ Bridge Safety Notice               │
│  • Funds locked during transfer        │
│  • Cannot cancel mid-bridge            │
│  • Verify destination address          │
├────────────────────────────────────────┤
│  [      Start Bridge Transfer      ]   │
└────────────────────────────────────────┘
```

**3-Stage Status Tracking**:
```
┌────────────────────────────────────────┐
│  Bridge in Progress                    │
├────────────────────────────────────────┤
│  ✅ Stage 1: Lock on Ethereum          │
│     Confirmed in block 19234567        │
│                                        │
│  ⏳ Stage 2: Bridge Protocol           │
│     Relaying... (estimated 8 min)      │
│                                        │
│  ⏸️ Stage 3: Mint on Polygon           │
│     Waiting for Stage 2...             │
└────────────────────────────────────────┘
```

**Technical Specs**:
- **API Endpoint**: `POST /v1/bridge` (new endpoint)
- **Status Endpoint**: `GET /v1/bridge/status/:txId`
- **Bridge Protocols**: Stargate, LayerZero, Wormhole, Axelar
- **Time Complexity**: 5-20 minutes depending on chains
- **Error Handling**: Retry mechanism for failed relay

---

### 3.3 PortfolioDashboard Widget (PRIORITY 3)

**Purpose**: Aggregate view of all holdings across all chains
**Status**: ❌ New
**Complexity**: Medium (4-5 hours)

**Features**:
- ✅ Total portfolio value (USD)
- ✅ Chain breakdown (pie chart)
- ✅ Token holdings table (all chains)
- ✅ 24h change (gain/loss)
- ✅ Quick actions (swap, bridge, send)
- ✅ Chain filter toggle
- ✅ Export to CSV

**UI Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  💼 Multi-Chain Portfolio                                      │
├────────────────────────────────────────────────────────────────┤
│  Total Balance                                                 │
│  $12,345.67                    24h: +$234.56 (+1.9%)          │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────────────────┐  │
│  │  Chain Breakdown │  │  Top Holdings                    │  │
│  │                  │  │  • ETH    $5,000  (40.5%)        │  │
│  │   ◉ Ethereum     │  │  • MATIC  $2,500  (20.2%)        │  │
│  │   ◉ Polygon      │  │  • BNB    $1,800  (14.6%)        │  │
│  │   ◉ BNB Chain    │  │  • AVAX   $1,200  (9.7%)         │  │
│  │   ◉ Arbitrum     │  │  • ARB    $900    (7.3%)         │  │
│  │   ◉ Others       │  │  • 12 more tokens...             │  │
│  └──────────────────┘  └──────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│  🔍 [Search tokens...] [All Chains ▼] [Export CSV]           │
├────────────────────────────────────────────────────────────────┤
│  Token      | Chain    | Balance      | Value    | 24h       │
│  ─────────────────────────────────────────────────────────    │
│  ETH        | Ethereum | 2.5 ETH      | $5,000   | +2.3%     │
│  MATIC      | Polygon  | 10,000 MATIC | $2,500   | -1.2%     │
│  BNB        | BNB      | 8.5 BNB      | $1,800   | +0.8%     │
│  AVAX       | Avalanche| 45 AVAX      | $1,200   | +3.4%     │
│  ARB        | Arbitrum | 1,200 ARB    | $900     | -0.5%     │
│  ⋮          | ⋮        | ⋮            | ⋮        | ⋮         │
└────────────────────────────────────────────────────────────────┘
```

**Technical Specs**:
- **API Endpoints**:
  - `/v1/tokens` (with multi-chain support)
  - `/v1/token-price` (real-time prices)
  - Web3 `balanceOf` calls for each chain
- **State Management**: Cache balances for 30 seconds
- **Chart Library**: Chart.js or D3.js for pie chart
- **Performance**: Batch requests to avoid rate limiting

---

### 3.4 TransactionHistory Widget (PRIORITY 4)

**Purpose**: Log and display all swap and bridge transactions
**Status**: ❌ New
**Complexity**: Low-Medium (2-3 hours)

**Features**:
- ✅ List all transactions (swap + bridge)
- ✅ Filter by: chain, token, status, date range
- ✅ Status indicators (pending, confirmed, failed)
- ✅ Transaction details modal
- ✅ Export to CSV
- ✅ Search by transaction hash
- ✅ Retry failed transactions

**UI Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  📜 Transaction History                                        │
├────────────────────────────────────────────────────────────────┤
│  🔍 [Search tx hash...]  [All Chains ▼] [Last 30 Days ▼]     │
│  [All Types ▼] [All Status ▼]                    [Export CSV]│
├────────────────────────────────────────────────────────────────┤
│  Date/Time       | Type   | From → To       | Status          │
│  ───────────────────────────────────────────────────────────  │
│  Oct 16, 10:23am | Swap   | 1 ETH → 2500... | ✅ Confirmed   │
│  Oct 16, 09:15am | Bridge | ETH → Polygon   | ⏳ Pending     │
│  Oct 15, 08:45pm | Swap   | 100 USDC → 0... | ✅ Confirmed   │
│  Oct 15, 03:30pm | Bridge | Polygon → BNB   | ❌ Failed      │
│  Oct 14, 11:20am | Swap   | 0.5 BNB → 25... | ✅ Confirmed   │
│  ⋮               | ⋮      | ⋮               | ⋮              │
├────────────────────────────────────────────────────────────────┤
│  Showing 1-10 of 47 transactions    [1] [2] [3] ... [5]      │
└────────────────────────────────────────────────────────────────┘
```

**Transaction Details Modal**:
```
┌────────────────────────────────────────┐
│  Transaction Details                   │
├────────────────────────────────────────┤
│  Type:        Swap (Same-Chain)        │
│  Date:        Oct 16, 2025 10:23am     │
│  Status:      ✅ Confirmed              │
│                                        │
│  From:        1.0 ETH                  │
│  To:          2,500.45 USDC            │
│  Network:     Ethereum                 │
│  Rate:        1 ETH = 2,500.45 USDC    │
│                                        │
│  Gas Fee:     $12.34                   │
│  Total Cost:  $2,512.79                │
│                                        │
│  Tx Hash:     0x1234...5678            │
│  Block:       #19234567                │
│  Timestamp:   2025-10-16 10:23:45 UTC  │
│                                        │
│  [View on Etherscan] [Export Receipt] │
└────────────────────────────────────────┘
```

**Technical Specs**:
- **Storage**: localStorage (prototype), later Supabase
- **API Endpoint**: `GET /v1/transaction-history/:address`
- **Pagination**: 10 transactions per page
- **Export Format**: CSV with all transaction details
- **Blockchain Explorer Links**: Etherscan, PolygonScan, etc.

---

## 4. Design System Consistency

All widgets **MUST** follow BroHub Design System v1.0 specifications:

### 4.1 Color Palette (CBO Green Theme)
```css
/* Primary Colors */
--primary-green: #3EB85F;        /* CBO primary */
--primary-green-light: #30D158;  /* iOS green */
--primary-green-dark: #2EA44F;   /* Hover state */

/* Background Colors */
--bg-primary: #0A0A0A;           /* Deep black */
--bg-secondary: #1A1A1A;         /* Card background */
--bg-tertiary: #2A2A2A;          /* Elevated elements */

/* Text Colors */
--text-primary: #FFFFFF;         /* Primary text */
--text-secondary: rgba(255, 255, 255, 0.7);  /* Secondary text */
--text-tertiary: rgba(255, 255, 255, 0.5);   /* Tertiary text */

/* Glassmorphism */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-blur: 10px;
```

### 4.2 Typography
```css
/* Font Stack */
font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;  /* Headings */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;          /* Body */
font-family: 'JetBrains Mono', 'Courier New', monospace;                      /* Code/Numbers */

/* Font Sizes (8px base scale) */
--font-size-xs: 12px;   /* Labels, captions */
--font-size-sm: 14px;   /* Body text */
--font-size-md: 16px;   /* Default */
--font-size-lg: 20px;   /* Subheadings */
--font-size-xl: 24px;   /* Headings */
--font-size-2xl: 32px;  /* Large headings */
```

### 4.3 Spacing (8px Grid)
```css
--space-xs: 4px;   /* Tight spacing */
--space-sm: 8px;   /* Default spacing */
--space-md: 16px;  /* Section spacing */
--space-lg: 24px;  /* Large spacing */
--space-xl: 32px;  /* Extra large spacing */
--space-2xl: 48px; /* Page-level spacing */
```

### 4.4 Border Radius
```css
--radius-sm: 8px;   /* Small elements */
--radius-md: 12px;  /* Cards */
--radius-lg: 16px;  /* Modals */
--radius-xl: 24px;  /* Large containers */
```

### 4.5 Transitions
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

### 4.6 Glassmorphism Effect
```css
.glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
}
```

---

## 5. Responsive Design Patterns

All widgets must support 6 breakpoints from v1.3.0:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RESPONSIVE BREAKPOINTS                           │
├──────────────────────┬──────────────────────────────────────────────────┤
│  Breakpoint          │  Specifications                                  │
├──────────────────────┼──────────────────────────────────────────────────┤
│  Desktop Large       │  1920px+    Full experience                      │
│  Desktop Standard    │  1024-1920  Default layout                       │
│  Tablet              │  600-1024   2-column grids                       │
│  Mobile Large        │  414-600    Single column, larger touch targets │
│  Mobile Standard     │  ≤414       Compact UI, 44px touch targets      │
│  Landscape Mobile    │  height<500 Horizontal optimization             │
├──────────────────────┴──────────────────────────────────────────────────┤
│  Special Considerations:                                                 │
│  • Touch targets: minimum 44px (iOS) / 48px (Android)                   │
│  • iPhone safe areas: env(safe-area-inset-*)                            │
│  • High DPI: @media (-webkit-min-device-pixel-ratio: 2)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Widget Communication Pattern

Widgets communicate via CustomEvents for loose coupling:

```javascript
// ChainSelector emits when chain is selected
document.dispatchEvent(new CustomEvent('chainSelected', {
    detail: {
        chainId: 'ethereum',
        chainName: 'Ethereum',
        nativeToken: 'ETH',
        rpcUrl: 'https://...',
        balance: '2.5',
        balanceUSD: '5000.00'
    }
}));

// Bridge widget listens for chain selection
document.addEventListener('chainSelected', (event) => {
    const chain = event.detail;
    // Update source or destination chain
});

// Portfolio widget listens for all transactions
document.addEventListener('transactionComplete', (event) => {
    const tx = event.detail;
    // Refresh portfolio balances
});
```

---

## 7. RocketX API Integration

### 7.1 Current API Usage (22% Coverage)
```javascript
// ✅ Currently Using
GET /v1/tokens              // Fetch token list
GET /v1/quotation           // Get swap quotes
```

### 7.2 New API Endpoints Required (78% Gap)
```javascript
// ❌ Not Yet Implemented (Required for v2.0)
GET  /v1/supported-chains    // Chain list (ChainSelector)
POST /v1/bridge              // Bridge transaction (BridgeWidget)
GET  /v1/bridge/status/:id   // Bridge status (BridgeWidget)
GET  /v1/transaction-history // User history (HistoryWidget)
GET  /v1/token-price         // Real-time prices (Portfolio)
GET  /v1/gas-price           // Gas estimates (all widgets)
GET  /v1/allowance           // ERC20 allowances (swap/bridge)
```

### 7.3 API Wrapper Architecture
Create `/widgets/shared/rocketx-api.js` to centralize API calls:

```javascript
// Centralized API wrapper
class RocketXAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.rocketx.exchange';
    }

    async getSupportedChains() { /* ... */ }
    async getTokens(chainId) { /* ... */ }
    async getQuote(params) { /* ... */ }
    async executeBridge(params) { /* ... */ }
    async getBridgeStatus(txId) { /* ... */ }
    async getTransactionHistory(address) { /* ... */ }
    async getTokenPrice(tokenAddress) { /* ... */ }
    async getGasPrice(chainId) { /* ... */ }
}
```

---

## 8. State Management

For prototype, use localStorage + CustomEvents:

```javascript
// Global state object
const AppState = {
    // Wallet
    wallet: {
        address: null,
        connected: false,
        chainId: null
    },

    // Selected chains
    chains: {
        source: 'ethereum',
        destination: 'polygon'
    },

    // Transaction history
    transactions: [],

    // Portfolio data
    portfolio: {
        totalValueUSD: 0,
        holdings: []
    }
};

// Persist to localStorage
function saveState() {
    localStorage.setItem('brofit_state', JSON.stringify(AppState));
}

// Restore from localStorage
function loadState() {
    const saved = localStorage.getItem('brofit_state');
    if (saved) Object.assign(AppState, JSON.parse(saved));
}
```

---

## 9. Development Roadmap

### Phase 1: Foundation (8 hours) ← **WE ARE HERE**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ✅ v1.3.0: Responsive Design Complete                                   │
│  ⏳ v2.0.0-alpha: Widget Prototypes                                      │
│     • ChainSelector widget (standalone)           3-4 hours              │
│     • BridgeWidget (cross-chain transfers)        6-8 hours              │
│     • PortfolioDashboard (multi-chain view)       4-5 hours              │
│     • TransactionHistory (transaction log)        2-3 hours              │
│     • Widgets Gallery (showcase page)             1-2 hours              │
│                                                    ─────────              │
│                                         TOTAL:     16-22 hours            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Integration (12 hours)
- Connect ChainSelector to existing swap widget
- Implement RocketX bridge API
- Add multi-chain balance fetching
- Create shared state management
- Testing and bug fixes

### Phase 3: Polish (8 hours)
- Performance optimization
- Accessibility improvements (ARIA labels)
- Error handling refinement
- Documentation updates
- User testing and feedback

### Phase 4: Production (16 hours)
- Security audit (API key proxy)
- Backend API for transaction storage
- Multi-wallet support (WalletConnect, Coinbase)
- Analytics integration
- Production deployment

---

## 10. Technical Constraints

### 10.1 Browser Support
- Chrome/Edge 90+ (Web3, backdrop-filter)
- Safari 14+ (Web3, backdrop-filter)
- Firefox 90+ (Web3, backdrop-filter)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

### 10.2 Dependencies
- **No heavy frameworks** (keep it vanilla JS for prototypes)
- **Optional lightweight libraries**:
  - Chart.js (portfolio charts)
  - date-fns (date formatting)
  - ethers.js (Web3 interactions)

### 10.3 Performance Targets
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.5s
- Cumulative Layout Shift: <0.1
- Bundle size per widget: <50KB gzipped

---

## 11. Security Considerations

### 11.1 API Key Protection (CRITICAL)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚠️  CRITICAL SECURITY ISSUE                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  Current: API key exposed in client-side JavaScript                     │
│  Risk:    Public key rotation, rate limit abuse, cost implications      │
│                                                                          │
│  ✅ Solution: Implement backend proxy                                    │
│     • Deploy serverless function (Vercel/Netlify)                       │
│     • Client → Backend → RocketX API                                    │
│     • Backend handles authentication                                    │
│     • Rate limiting per user/IP                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Web3 Security
- Always validate addresses before transactions
- Display clear transaction confirmation modals
- Show gas fee estimates before signing
- Implement transaction timeout handling
- Never store private keys

### 11.3 Input Validation
- Sanitize all user inputs
- Validate token amounts (max decimals)
- Prevent XSS attacks (escape user content)
- Rate limit API calls

---

## 12. Success Metrics

### 12.1 Technical Metrics
- ✅ All 5 widgets implemented and functional
- ✅ API coverage: 22% → 80%+ (7/9 endpoints)
- ✅ Network coverage: 0.6% → 20%+ (1 → 36+ chains)
- ✅ Lighthouse score: 92 → 95+ (A → A+)
- ✅ Bundle size: <300KB total (all widgets)

### 12.2 User Experience Metrics
- ChainSelector: <2 seconds to select chain
- Bridge transaction: Clear 3-stage progress
- Portfolio: Load all balances in <3 seconds
- History: Search results in <500ms
- Responsive: No layout shifts on resize

---

## 13. Next Steps (Immediate)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  IMMEDIATE ACTION PLAN (Next 16-22 hours)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  [1] Create shared styles and utilities                                 │
│      • /widgets/shared/styles.css (BroHub Design System)                │
│      • /widgets/shared/utils.js (Web3, formatting)                      │
│      • /widgets/shared/rocketx-api.js (API wrapper)                     │
│                                                                          │
│  [2] Build ChainSelector Widget (Foundation)                            │
│      • /widgets/chain-selector.html                                     │
│      • Fetch 180+ chains from RocketX                                   │
│      • Search, filter, group functionality                              │
│      • Balance display per chain                                        │
│      • CustomEvent emission on selection                                │
│                                                                          │
│  [3] Build BridgeWidget                                                 │
│      • /widgets/bridge.html                                             │
│      • Dual ChainSelector integration                                   │
│      • Bridge protocol selection                                        │
│      • Multi-stage status tracking                                      │
│      • Cross-chain gas estimation                                       │
│                                                                          │
│  [4] Build PortfolioDashboard Widget                                    │
│      • /widgets/portfolio.html                                          │
│      • Multi-chain balance aggregation                                  │
│      • Pie chart visualization                                          │
│      • Token holdings table                                             │
│      • Export to CSV functionality                                      │
│                                                                          │
│  [5] Build TransactionHistory Widget                                    │
│      • /widgets/history.html                                            │
│      • Transaction list with filters                                    │
│      • Status indicators                                                │
│      • Transaction detail modal                                         │
│      • Export and search functionality                                  │
│                                                                          │
│  [6] Create Widgets Gallery                                             │
│      • /widgets/gallery.html                                            │
│      • Showcase all 5 widgets                                           │
│      • Interactive demos                                                │
│      • Code snippets for integration                                    │
│      • Documentation links                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Conclusion

This architecture transforms BroFit Native Swap from a single-chain MVP to a comprehensive multi-chain DeFi platform. The modular widget approach enables:

1. **Scalability**: Each widget is independent and reusable
2. **Maintainability**: Clear separation of concerns
3. **Flexibility**: Widgets can be embedded or standalone
4. **Consistency**: Shared design system and utilities
5. **Performance**: Lazy loading and code splitting

**Key Insight**: The ChainSelector is the critical foundation that unlocks all other widgets. By prioritizing it first, we enable rapid development of Bridge, Portfolio, and History widgets.

---

**Built with 💪 by the BroFit team**
**Architecture v2.0.0-prototype | 2025-10-16**
