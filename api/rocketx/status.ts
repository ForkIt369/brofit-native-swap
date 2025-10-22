/**
 * RocketX Status Edge Function
 * Proxies /v1/status to check transaction status
 *
 * Required params:
 * - requestId: Request ID from /v1/swap response
 *
 * Optional params:
 * - txId: Transaction hash (for walletless swaps)
 *
 * Response includes:
 * - status: "pending" | "success" | "failed"
 * - subState: Detailed transaction state (7 states)
 * - partnersCommission: Revenue sharing percentage
 * - originTransactionHash & destinationTransactionHash
 * - originTransactionUrl & destinationTransactionUrl (block explorer links)
 */

import { handlePreflight, jsonResponse, errorResponse } from '../utils/cors';
import { fetchJSON } from '../utils/fetchWithTimeout';

export const config = {
  runtime: 'edge',
};

const ROCKETX_BASE_URL = 'https://api.rocketx.exchange';
const CACHE_TTL = 30; // 30 seconds (status changes frequently)

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
    const requestId = url.searchParams.get('requestId');
    const txId = url.searchParams.get('txId');

    // Validate required parameters
    if (!requestId) {
      return errorResponse('Missing required parameter: requestId', 400, origin);
    }

    // Build query params
    const queryParams = new URLSearchParams({ requestId });
    if (txId) {
      queryParams.append('txId', txId);
    }

    // Check cache first (short TTL since status changes)
    const cacheKey = `rocketx:status:${requestId}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expires > now) {
      // Only return cached if status is final (success/failed)
      const isFinalStatus = cached.data.status === 'success' || cached.data.status === 'failed';
      if (isFinalStatus) {
        console.log(`✅ Cache hit for status ${requestId} (final state)`);
        return jsonResponse({
          ...cached.data,
          cached: true
        }, 200, origin);
      }
    }

    // Fetch from RocketX
    console.log(`🔍 Checking status for requestId: ${requestId}`);

    const data = await fetchJSON(`${ROCKETX_BASE_URL}/v1/status?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'x-api': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000,
      retries: 1,
      retryOn: [429, 500, 502, 503, 504]
    });

    // Cache the response (longer TTL for final states)
    const isFinalStatus = data.status === 'success' || data.status === 'failed';
    const ttl = isFinalStatus ? 3600 : CACHE_TTL; // 1 hour for final, 30s for pending

    cache.set(cacheKey, {
      data,
      expires: now + (ttl * 1000)
    });

    // Log status for debugging
    console.log(`✅ Status: ${data.status} | SubState: ${data.subState}`);

    // Add helpful metadata
    return jsonResponse({
      ...data,
      cached: false,
      statusExplanation: getStatusExplanation(data.status, data.subState)
    }, 200, origin);

  } catch (error: any) {
    console.error('RocketX status error:', error);

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
    return errorResponse('Failed to fetch transaction status', 500, origin);
  }
}

/**
 * Get human-readable explanation of transaction status
 */
function getStatusExplanation(status: string, subState: string): string {
  const explanations: Record<string, string> = {
    'transaction_pending': 'Request ID generated - awaiting deposit',
    'pending': 'Pending receiving deposit from user',
    'approved': 'Deposit received - preparing swap',
    'executed': 'Swap completed on source chain',
    'withdrawal': 'Withdrawal initiated to destination',
    'withdraw_success': '✅ Complete! Tokens transferred successfully',
    'invalid': '❌ Transaction timed out or failed'
  };

  if (status === 'success') {
    return '✅ Transaction completed successfully';
  } else if (status === 'failed') {
    return '❌ Transaction failed';
  } else if (status === 'pending') {
    return explanations[subState] || 'Transaction in progress';
  }

  return 'Unknown status';
}
