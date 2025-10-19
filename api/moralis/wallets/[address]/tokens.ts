/**
 * Moralis Wallet Tokens Edge Function
 * Proxies requests to Moralis API for wallet token balances
 * Supports caching with 60s duration
 */

import { handlePreflight, jsonResponse, errorResponse } from '../../../utils/cors';
import { fetchJSON } from '../../../utils/fetchWithTimeout';
import { isValidAddress, isSupportedChain } from '../../../utils/validate';

export const config = {
  runtime: 'edge',
};

const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

// Chain mapping from human-readable to Moralis hex format
const CHAIN_MAP: { [key: string]: string } = {
  'eth': '0x1',
  'ethereum': '0x1',
  'polygon': '0x89',
  'matic': '0x89',
  'bsc': '0x38',
  'binance': '0x38',
  'arbitrum': '0xa4b1',
  'optimism': '0xa',
  'avalanche': '0xa86a',
  'avax': '0xa86a',
  'fantom': '0xfa',
  'ftm': '0xfa'
};

export default async function handler(request: Request) {
  const origin = request.headers.get('origin') || undefined;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handlePreflight(request);
  }

  // Only allow GET
  if (request.method !== 'GET') {
    return errorResponse('Method not allowed', 405, origin);
  }

  try {
    // Get API key from environment
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      console.error('MORALIS_API_KEY not configured');
      return errorResponse('Server configuration error', 500, origin);
    }

    // Parse URL to get address parameter
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const addressIndex = pathParts.findIndex(part => part === 'wallets') + 1;
    const address = pathParts[addressIndex];

    // Validate address
    if (!address || !isValidAddress(address)) {
      return errorResponse('Invalid Ethereum address', 400, origin);
    }

    // Get chain parameter (defaults to 'eth')
    const chainParam = url.searchParams.get('chain') || 'eth';
    const chain = CHAIN_MAP[chainParam.toLowerCase()] || chainParam;

    // Validate chain (optional - Moralis will reject invalid chains)
    // We don't strictly enforce our supported chains here as Moralis supports more

    // Build Moralis API URL
    const moralisUrl = `${MORALIS_BASE_URL}/wallets/${address}/tokens?chain=${chain}`;

    // Fetch from Moralis with timeout and retry
    const data = await fetchJSON(moralisUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey
      },
      timeout: 30000, // 30 seconds for portfolio data
      retries: 1,
      retryOn: [429, 500, 502, 503, 504]
    });

    // Return with cache headers (60s cache)
    const response = jsonResponse(data, 200, origin);
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');

    return response;

  } catch (error: any) {
    console.error('Moralis tokens error:', error);

    // Handle timeout
    if (error.message.includes('timeout')) {
      return errorResponse('Request timeout - Moralis API is slow', 504, origin);
    }

    // Handle 401 (invalid API key)
    if (error.message.includes('401')) {
      return errorResponse('Moralis API authentication failed', 401, origin);
    }

    // Handle rate limiting
    if (error.message.includes('429')) {
      return errorResponse('Rate limit exceeded - please try again later', 429, origin);
    }

    // Handle HTTP errors
    if (error.message.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 500;
      return errorResponse(`Moralis API error: ${error.message}`, status, origin);
    }

    // Generic error
    return errorResponse('Failed to fetch wallet tokens from Moralis', 500, origin);
  }
}
