/**
 * RocketX Quotation Edge Function
 * Proxies POST /v1/quote to get swap/bridge quotes
 * Uses addresses (not IDs) for quotation requests
 *
 * Required params:
 * - fromTokenAddress: Source token address
 * - toTokenAddress: Destination token address
 * - amount: Amount in wei/smallest unit
 * - fromTokenChainId: Source chain ID (hex format, e.g. "0x1")
 * - toTokenChainId: Destination chain ID (hex format)
 *
 * Optional params:
 * - slippage: Slippage tolerance (default: 1)
 * - referrer: Referrer address for revenue sharing
 * - partnerId: Partner ID (default: "brofit")
 */

import { handlePreflight, jsonResponse, errorResponse } from '../utils/cors';
import { fetchJSON } from '../utils/fetchWithTimeout';
import { isValidAddress } from '../utils/validate';

export const config = {
  runtime: 'edge',
};

const ROCKETX_BASE_URL = 'https://api.rocketx.exchange';

interface QuoteRequest {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string | number;
  fromTokenChainId: string;
  toTokenChainId: string;
  slippage?: number;
  referrer?: string;
  partnerId?: string;
}

export default async function handler(request: Request) {
  const origin = request.headers.get('origin') || undefined;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handlePreflight(request);
  }

  // Only allow POST (per Postman documentation)
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed - use POST', 405, origin);
  }

  try {
    // Get API key from environment
    const apiKey = process.env.ROCKETX_API_KEY?.trim();
    if (!apiKey) {
      console.error('ROCKETX_API_KEY not configured');
      return errorResponse('Server configuration error', 500, origin);
    }

    // Parse request body
    const params: QuoteRequest = await request.json();

    // Validate required parameters
    if (!params.fromTokenAddress || !params.toTokenAddress || !params.amount || !params.fromTokenChainId || !params.toTokenChainId) {
      return errorResponse(
        'Missing required parameters: fromTokenAddress, toTokenAddress, amount, fromTokenChainId, toTokenChainId',
        400,
        origin
      );
    }

    // Validate token addresses
    if (!isValidAddress(params.fromTokenAddress)) {
      return errorResponse('Invalid fromTokenAddress format', 400, origin);
    }
    if (!isValidAddress(params.toTokenAddress)) {
      return errorResponse('Invalid toTokenAddress format', 400, origin);
    }

    // Validate referrer address if provided
    if (params.referrer && !isValidAddress(params.referrer)) {
      return errorResponse('Invalid referrer address format', 400, origin);
    }

    // Build quotation payload (uses addresses)
    const quotationPayload = {
      fromTokenAddress: params.fromTokenAddress,
      toTokenAddress: params.toTokenAddress,
      amount: params.amount.toString(),
      fromTokenChainId: params.fromTokenChainId,
      toTokenChainId: params.toTokenChainId,
      slippage: params.slippage || 1,
      referrer: params.referrer || '0x0000000000000000000000000000000000000000',
      partnerId: params.partnerId || 'brofit'
    };

    console.log('💡 Fetching quotation:', {
      from: params.fromTokenAddress.substring(0, 10) + '...',
      to: params.toTokenAddress.substring(0, 10) + '...',
      fromChain: params.fromTokenChainId,
      toChain: params.toTokenChainId
    });

    // Fetch quotation from RocketX (POST to /rocketx/v1/quote - testing new path)
    const data = await fetchJSON(`${ROCKETX_BASE_URL}/rocketx/v1/quote`, {
      method: 'POST',
      headers: {
        'x-api': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quotationPayload),
      timeout: 15000,
      retries: 1,
      retryOn: [429, 500, 502, 503, 504]
    });

    console.log('✅ Quotation fetched successfully');

    return jsonResponse(data, 200, origin);

  } catch (error: any) {
    console.error('RocketX quote error:', error);

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
    return errorResponse('Failed to fetch quote from RocketX', 500, origin);
  }
}
