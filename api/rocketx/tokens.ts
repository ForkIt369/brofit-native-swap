/**
 * RocketX Tokens Edge Function
 * Proxies /v1/tokens to get paginated token list with search
 * Required params: chainId, page, perPage
 * Optional: keyword (search filter)
 */

import { handlePreflight, jsonResponse, errorResponse } from '../utils/cors';
import { fetchJSON } from '../utils/fetchWithTimeout';

export const config = {
  runtime: 'edge',
};

const ROCKETX_BASE_URL = 'https://api.rocketx.exchange';
const CACHE_TTL = 300; // 5 minutes (tokens don't change often)

// Simple in-memory cache for Edge runtime
const cache = new Map<string, { data: any; expires: number }>();

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
    const apiKey = process.env.ROCKETX_API_KEY?.trim();
    if (!apiKey) {
      console.error('ROCKETX_API_KEY not configured');
      return errorResponse('Server configuration error', 500, origin);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const chainId = url.searchParams.get('chainId');
    const page = url.searchParams.get('page') || '1';
    const perPage = url.searchParams.get('perPage') || '100';
    const keyword = url.searchParams.get('keyword') || 'All';

    // Validate required parameters
    if (!chainId) {
      return errorResponse('Missing required parameter: chainId (e.g., "0x1" for Ethereum)', 400, origin);
    }

    // Validate perPage (max 600 per RocketX docs)
    const perPageNum = parseInt(perPage);
    if (perPageNum > 600) {
      return errorResponse('perPage exceeds maximum of 600', 400, origin);
    }

    // Build query params
    const queryParams = new URLSearchParams({
      chainId,
      page,
      perPage,
      keyword
    });

    // Check cache first
    const cacheKey = `rocketx:tokens:${queryParams.toString()}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expires > now) {
      console.log(`✅ Cache hit for tokens (${chainId}, page ${page})`);
      return jsonResponse({
        ...cached.data,
        cached: true
      }, 200, origin);
    }

    // Cache miss - fetch from RocketX
    console.log(`❌ Cache miss for tokens (${chainId}, page ${page}) - fetching from RocketX`);

    const data = await fetchJSON(`${ROCKETX_BASE_URL}/v1/tokens?${queryParams.toString()}`, {
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

    // Log token count for debugging
    const tokenCount = data.tokens?.length || 0;
    console.log(`✅ Loaded ${tokenCount} tokens for chain ${chainId}`);

    return jsonResponse({
      ...data,
      cached: false
    }, 200, origin);

  } catch (error: any) {
    console.error('RocketX tokens error:', error);

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
    return errorResponse('Failed to fetch tokens from RocketX', 500, origin);
  }
}
