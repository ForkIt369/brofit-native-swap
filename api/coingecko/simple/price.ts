/**
 * CoinGecko Simple Price Edge Function
 * Proxies price requests to CoinGecko API with server-side API key
 * Supports caching with 600s (10 min) duration
 */

import { handlePreflight, jsonResponse, errorResponse } from '../../utils/cors';
import { fetchJSON } from '../../utils/fetchWithTimeout';

export const config = {
  runtime: 'edge',
};

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

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
    // Get API key from environment (trim any whitespace/newlines)
    const apiKey = process.env.COINGECKO_API_KEY?.trim();
    if (!apiKey) {
      console.error('COINGECKO_API_KEY not configured');
      return errorResponse('Server configuration error', 500, origin);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids');
    const vsCurrencies = url.searchParams.get('vs_currencies') || 'usd';
    const include24hrChange = url.searchParams.get('include_24hr_change') || 'true';
    const includeMarketCap = url.searchParams.get('include_market_cap') || 'true';
    const include24hrVol = url.searchParams.get('include_24hr_vol') || 'true';

    // Validate required parameters
    if (!ids) {
      return errorResponse('Missing required parameter: ids', 400, origin);
    }

    // Build CoinGecko API URL
    const coinGeckoUrl = new URL(`${COINGECKO_BASE_URL}/simple/price`);
    coinGeckoUrl.searchParams.set('ids', ids);
    coinGeckoUrl.searchParams.set('vs_currencies', vsCurrencies);
    coinGeckoUrl.searchParams.set('include_24hr_change', include24hrChange);
    coinGeckoUrl.searchParams.set('include_market_cap', includeMarketCap);
    coinGeckoUrl.searchParams.set('include_24hr_vol', include24hrVol);
    coinGeckoUrl.searchParams.set('x_cg_demo_api_key', apiKey);

    // Fetch from CoinGecko with timeout and retry
    const data = await fetchJSON(coinGeckoUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000, // 10 seconds
      retries: 1,
      retryOn: [429, 500, 502, 503, 504]
    });

    // Return with cache headers (600s = 10 min cache)
    const response = jsonResponse(data, 200, origin);
    response.headers.set('Cache-Control', 'public, max-age=600, s-maxage=600');

    return response;

  } catch (error: any) {
    console.error('CoinGecko price error:', error);

    // Handle timeout
    if (error.message.includes('timeout')) {
      return errorResponse('Request timeout - CoinGecko API is slow', 504, origin);
    }

    // Handle rate limiting
    if (error.message.includes('429')) {
      return errorResponse('Rate limit exceeded - please try again later', 429, origin);
    }

    // Handle HTTP errors
    if (error.message.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 500;
      return errorResponse(`CoinGecko API error: ${error.message}`, status, origin);
    }

    // Generic error
    return errorResponse('Failed to fetch prices from CoinGecko', 500, origin);
  }
}
