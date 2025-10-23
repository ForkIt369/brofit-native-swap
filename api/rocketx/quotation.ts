/**
 * RocketX Quotation Edge Function (GET)
 *
 * CRITICAL: This endpoint uses GET, not POST!
 *
 * Based on Telegram support discoveries:
 * - Method: GET (not POST!)
 * - Parameters: fromToken, fromNetwork, toToken, toNetwork, amount, slippage
 * - Token format: Use actual token address or "null" for native tokens
 * - Network format: Use names like "ethereum", "solana", "Base Chain" (NOT hex!)
 *
 * Example:
 * GET /v1/quotation?fromToken=null&fromNetwork=ethereum&toToken=null&toNetwork=ethereum&amount=1&slippage=1
 *
 * Response includes:
 * - savingUsd (recommended for ordering quotes)
 * - gasFeeUsd
 * - priceImpact
 * - minRecieved
 * - toAmount
 */

import { handlePreflight, jsonResponse, errorResponse } from '../utils/cors';
import { fetchJSON } from '../utils/fetchWithTimeout';

export const config = {
  runtime: 'edge',
};

const ROCKETX_BASE_URL = 'https://api.rocketx.exchange';
const CACHE_TTL = 10; // 10 seconds (quotes change frequently)

// Simple in-memory cache for Edge runtime
const cache = new Map<string, { data: any; expires: number }>();

export default async function handler(request: Request) {
  const origin = request.headers.get('origin') || undefined;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handlePreflight(request);
  }

  // Only allow GET (CRITICAL: Not POST!)
  if (request.method !== 'GET') {
    return errorResponse('Method not allowed - use GET', 405, origin);
  }

  try {
    // Get API key from environment
    const apiKey = process.env.ROCKETX_API_KEY?.trim();
    if (!apiKey) {
      console.error('ROCKETX_API_KEY not configured');
      return errorResponse('Server configuration error', 500, origin);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const fromToken = url.searchParams.get('fromToken');
    const fromNetwork = url.searchParams.get('fromNetwork');
    const toToken = url.searchParams.get('toToken');
    const toNetwork = url.searchParams.get('toNetwork');
    const amount = url.searchParams.get('amount');
    const slippage = url.searchParams.get('slippage') || '1';
    const includedExchanges = url.searchParams.get('includedExchanges');

    // Validate required parameters
    if (!fromToken || !fromNetwork || !toToken || !toNetwork || !amount) {
      return errorResponse(
        'Missing required parameters: fromToken, fromNetwork, toToken, toNetwork, amount',
        400,
        origin
      );
    }

    // Build query params
    const queryParams = new URLSearchParams({
      fromToken,
      fromNetwork,
      toToken,
      toNetwork,
      amount,
      slippage
    });

    // Add optional exchanges filter
    if (includedExchanges) {
      queryParams.set('includedExchanges', includedExchanges);
    }

    // Check cache first
    const cacheKey = `rocketx:quotation:${queryParams.toString()}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expires > now) {
      console.log(`✅ Cache hit for quotation`);
      return jsonResponse({
        ...cached.data,
        cached: true
      }, 200, origin);
    }

    console.log('💡 Fetching quotation from RocketX:', {
      from: `${fromToken} (${fromNetwork})`,
      to: `${toToken} (${toNetwork})`,
      amount
    });

    // Fetch quotation from RocketX (GET request!)
    const data = await fetchJSON(`${ROCKETX_BASE_URL}/v1/quotation?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'x-api': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000,
      retries: 1,
      retryOn: [429, 500, 502, 503, 504]
    });

    // Cache the response
    cache.set(cacheKey, {
      data,
      expires: now + (CACHE_TTL * 1000)
    });

    console.log('✅ Quotation fetched successfully');

    return jsonResponse({
      ...data,
      cached: false
    }, 200, origin);

  } catch (error: any) {
    console.error('RocketX quotation error:', error);

    // Handle timeout errors
    if (error.message.includes('timeout')) {
      return errorResponse('Request timeout - RocketX API is slow', 504, origin);
    }

    // Handle rate limiting
    if (error.message.includes('429')) {
      return errorResponse('Rate limit exceeded - please try again later', 429, origin);
    }

    // Handle HTTP errors
    if (error.message.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 500;
      return errorResponse(`RocketX API error: ${error.message}`, status, origin);
    }

    // Generic error
    return errorResponse('Failed to fetch quotation from RocketX', 500, origin);
  }
}
