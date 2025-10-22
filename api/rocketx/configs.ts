/**
 * RocketX Configs Edge Function
 * Proxies /v1/configs to get master configuration (197 networks, exchanges, settings)
 * Caches response for 10 minutes (networks don't change often)
 */

import { handlePreflight, jsonResponse, errorResponse } from '../utils/cors';
import { fetchJSON } from '../utils/fetchWithTimeout';

export const config = {
  runtime: 'edge',
};

const ROCKETX_BASE_URL = 'https://api.rocketx.exchange';
const CACHE_TTL = 600; // 10 minutes

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

    // Check cache first
    const cacheKey = 'rocketx:configs';
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expires > now) {
      console.log('✅ Cache hit for configs');
      return jsonResponse({
        ...cached.data,
        cached: true,
        cache_age_seconds: Math.floor((now - (cached.expires - CACHE_TTL * 1000)) / 1000)
      }, 200, origin);
    }

    // Cache miss - fetch from RocketX
    console.log('❌ Cache miss for configs - fetching from RocketX');

    const data = await fetchJSON(`${ROCKETX_BASE_URL}/v1/configs`, {
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

    // Log network count for debugging
    const networkCount = data.supported_network?.length || 0;
    console.log(`✅ Loaded ${networkCount} networks from RocketX`);

    return jsonResponse({
      ...data,
      cached: false
    }, 200, origin);

  } catch (error: any) {
    console.error('RocketX configs error:', error);

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
    return errorResponse('Failed to fetch configs from RocketX', 500, origin);
  }
}
