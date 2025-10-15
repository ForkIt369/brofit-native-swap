# 💪 BroFit Native Swap

A fully functional decentralized token swap interface powered by RocketX API with native BroFit branding.

![BroFit Swap](https://img.shields.io/badge/Status-Production%20Ready-green)
![RocketX](https://img.shields.io/badge/Powered%20by-RocketX%20API-blue)
![Web3](https://img.shields.io/badge/Web3-MetaMask-orange)

## 🚀 Live Demo

**Production:** [https://brofit-swap.vercel.app](https://brofit-swap.vercel.app)

## ✨ Features

### 🎯 Core Functionality
- **240+ Tokens**: Full Ethereum token list from RocketX API
- **Real-time Quotes**: Live swap quotes from 10+ DEX aggregators
- **Token Search**: Instant search and filter by symbol, name, or address
- **Best Routes**: Automatic route optimization via VELORA, Uniswap, and more
- **Price Impact**: Real-time price impact calculation
- **Network Fees**: Accurate gas fee estimates in USD

### 🔐 Web3 Integration
- **MetaMask Support**: Native wallet connection
- **ERC20 Approvals**: Smart allowance checking and approval flow
- **Transaction Signing**: Secure transaction signing via Web3
- **Status Polling**: Real-time transaction confirmation tracking
- **Balance Fetching**: Live token balance display

### 🎨 UI/UX
- **BroFit Branding**: Native #3EB85F green theme
- **Responsive Design**: Mobile-first, desktop-optimized
- **Token Icons**: CDN-sourced logos with fallbacks
- **Loading States**: Smooth loading and error states
- **Tooltips**: Helpful information tooltips

## 📋 Technical Stack

```
Frontend:     Vanilla JavaScript (ES6+)
Styling:      CSS3 with OKLCH colors
Web3:         window.ethereum (MetaMask)
API:          RocketX REST API v1
Blockchain:   Ethereum mainnet
```

## 🔧 API Integration

### RocketX API Endpoints
- **GET /v1/tokens** - Fetch available tokens
- **GET /v1/quotation** - Get swap quotes with multi-route comparison
- **Best Practices**:
  - API key authentication
  - Rate limiting handling
  - Error recovery

### Web3 Methods
- `eth_requestAccounts` - Wallet connection
- `eth_call` - Read-only contract calls (balanceOf, allowance)
- `eth_sendTransaction` - Transaction signing (approve, swap)
- `eth_getTransactionReceipt` - Transaction status polling

## 🏗️ Project Structure

```
brofit-native-swap/
├── index.html              # Main swap interface
├── gallery.html            # Gallery page
├── approach-4-wrapper.html # Wrapper demo
├── README.md               # This file
├── vercel.json            # Vercel configuration
└── .gitignore             # Git ignore rules
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Manual Deployment
1. Upload all HTML files to your hosting
2. Ensure HTTPS is enabled (required for MetaMask)
3. Configure CORS headers if needed

## 🔐 Environment Variables

No environment variables needed! The RocketX API key is included in the code for demo purposes.

**Production Note**: For production use, consider implementing a backend proxy to secure the API key.

## 💻 Local Development

```bash
# Serve locally (requires Python 3)
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

**Note**: MetaMask requires HTTPS in production. Local development uses `http://localhost` which MetaMask allows.

## 🎯 Usage

1. **Connect Wallet**: Click "Connect Wallet" to connect MetaMask
2. **Select Tokens**: Click token dropdowns to browse and search
3. **Enter Amount**: Type the amount you want to swap
4. **Get Quote**: See live quotes with rates and fees
5. **Execute Swap**: Click "Swap" to execute the transaction
6. **Confirm**: Approve in MetaMask and wait for confirmation

## 🔍 Features Deep Dive

### Token Selection
- **240+ Ethereum tokens** fetched from RocketX
- **Real-time search** filters by symbol, name, or contract address
- **Token icons** loaded from multiple CDN sources with fallback handling
- **Native vs ERC20** distinction (ETH vs wrapped tokens)

### Quote System
- **Multi-route comparison** across 10+ DEX aggregators
- **Best route selection** based on output amount
- **Price impact calculation** to warn of slippage
- **Network fee estimates** in USD for better UX
- **Minimum received** calculation for slippage protection

### Swap Execution
- **Smart approval flow**: Only requests approval when needed
- **Allowance checking**: Reuses existing approvals when sufficient
- **Transaction signing**: Secure signing via MetaMask
- **Status polling**: Waits for confirmation with visual feedback
- **Error handling**: Clear error messages for failed transactions

## 📊 Statistics Panel

- **24h Volume**: $124.5M (sample data)
- **Total Swaps**: 1.2M+ (sample data)
- **Networks**: 15+ supported chains
- **Tokens**: 500+ available tokens

## 🐛 Known Issues

- MetaMask must be installed and unlocked
- Requires Ethereum mainnet connection
- Some tokens may have low liquidity
- Gas fees can be high during network congestion

## 🛣️ Roadmap

- [ ] Multi-chain support (Polygon, Arbitrum, Optimism)
- [ ] Token portfolio tracking
- [ ] Transaction history
- [ ] Price charts integration
- [ ] Limit orders
- [ ] Swap analytics dashboard

## 📝 License

MIT License - Free to use and modify

## 🙏 Credits

- **RocketX API**: Cross-chain swap aggregation
- **MetaMask**: Web3 wallet provider
- **BroFit**: Brand and design system

## 📧 Contact

For issues or questions, please open a GitHub issue.

---

**Built with 💪 by the BroFit team**
