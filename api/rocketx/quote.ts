/**
 * RocketX Quote Edge Function
 * Proxies quote requests to RocketX API with server-side API key
 * Supports both swap and bridge quotations
 */

import { handlePreflight, jsonResponse, errorResponse } from '../utils/cors';
import { fetchJSON } from '../utils/fetchWithTimeout';
import { isValidAddress, isValidAmount, isValidChainId, isSupportedChain } from '../utils/validate';

export const config = {
  runtime: 'edge',
};

const ROCKETX_BASE_URL = 'https://api.rocketx.exchange';

interface QuoteRequest {
  fromToken: string;
  toToken: string;
  amount: string | number;
  fromNetwork?: string;
  toNetwork?: string;
  network?: string;
  slippage?: number;
  type?: 'swap' | 'bridge';
}

export default async function handler(request: Request) {
  const origin = request.headers.get('origin') || undefined;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handlePreflight(request);
  }

  // Only allow GET and POST
  if (request.method !== 'GET' && request.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin);
  }

  try {
    // Get API key from environment
    const apiKey = process.env.ROCKETX_API_KEY;
    if (!apiKey) {
      console.error('ROCKETX_API_KEY not configured');
      return errorResponse('Server configuration error', 500, origin);
    }

    // Parse request parameters
    let params: QuoteRequest;

    if (request.method === 'POST') {
      params = await request.json();
    } else {
      const url = new URL(request.url);
      params = {
        fromToken: url.searchParams.get('fromToken') || '',
        toToken: url.searchParams.get('toToken') || '',
        amount: url.searchParams.get('amount') || '',
        fromNetwork: url.searchParams.get('fromNetwork') || undefined,
        toNetwork: url.searchParams.get('toNetwork') || undefined,
        network: url.searchParams.get('network') || undefined,
        slippage: parseFloat(url.searchParams.get('slippage') || '0.5'),
        type: (url.searchParams.get('type') as 'swap' | 'bridge') || 'swap'
      };
    }

    // Validate required parameters
    if (!params.fromToken || !params.toToken || !params.amount) {
      return errorResponse('Missing required parameters: fromToken, toToken, amount', 400, origin);
    }

    // Validate amount
    if (!isValidAmount(params.amount)) {
      return errorResponse('Invalid amount format', 400, origin);
    }

    // Validate token addresses if they're addresses (not symbols)
    if (params.fromToken.startsWith('0x') && !isValidAddress(params.fromToken)) {
      return errorResponse('Invalid fromToken address', 400, origin);
    }
    if (params.toToken.startsWith('0x') && !isValidAddress(params.toToken)) {
      return errorResponse('Invalid toToken address', 400, origin);
    }

    // Determine if this is a swap or bridge based on networks
    const isBridge = params.type === 'bridge' || (params.fromNetwork && params.toNetwork && params.fromNetwork !== params.toNetwork);

    let rocketxUrl: string;
    let requestBody: any;

    if (isBridge) {
      // Bridge quotation (POST request)
      rocketxUrl = `${ROCKETX_BASE_URL}/v1/bridge/quotation`;
      requestBody = {
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.amount.toString(),
        fromNetwork: params.fromNetwork || params.network || 'ethereum',
        toNetwork: params.toNetwork || 'ethereum',
        slippage: params.slippage || 1.0
      };

      const data = await fetchJSON(rocketxUrl, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        timeout: 15000,
        retries: 1,
        retryOn: [429, 500, 502, 503, 504]
      });

      return jsonResponse(data, 200, origin);

    } else {
      // Swap quotation (GET request)
      const queryParams = new URLSearchParams({
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.amount.toString(),
        network: params.network || params.fromNetwork || 'ethereum',
        slippage: (params.slippage || 0.5).toString()
      });

      rocketxUrl = `${ROCKETX_BASE_URL}/v1/quotation?${queryParams.toString()}`;

      const data = await fetchJSON(rocketxUrl, {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        retries: 1,
        retryOn: [429, 500, 502, 503, 504]
      });

      return jsonResponse(data, 200, origin);
    }

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
