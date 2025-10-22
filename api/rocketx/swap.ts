/**
 * RocketX Swap Edge Function
 * Proxies /v1/swap to execute swap transactions
 * CRITICAL: This endpoint requires token IDs, NOT contract addresses!
 *
 * Required params:
 * - fromTokenId: RocketX internal token ID
 * - toTokenId: RocketX internal token ID
 * - fromTokenAmount: Amount in wei/smallest unit
 * - userAddress: User's wallet address
 * - slippage: Slippage tolerance (default: 1)
 * - referrer: Referrer address for revenue sharing (optional)
 * - partnerId: Partner ID (optional)
 */

import { handlePreflight, jsonResponse, errorResponse } from '../utils/cors';
import { fetchJSON } from '../utils/fetchWithTimeout';
import { isValidAddress } from '../utils/validate';

export const config = {
  runtime: 'edge',
};

const ROCKETX_BASE_URL = 'https://api.rocketx.exchange';

interface SwapRequest {
  fromTokenId: number;
  toTokenId: number;
  fromTokenAmount: string;
  userAddress: string;
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

  // Only allow POST
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
    const params: SwapRequest = await request.json();

    // Validate required parameters
    if (!params.fromTokenId || !params.toTokenId || !params.fromTokenAmount || !params.userAddress) {
      return errorResponse(
        'Missing required parameters: fromTokenId, toTokenId, fromTokenAmount, userAddress',
        400,
        origin
      );
    }

    // Validate user address
    if (!isValidAddress(params.userAddress)) {
      return errorResponse('Invalid userAddress format', 400, origin);
    }

    // Validate referrer address if provided
    if (params.referrer && !isValidAddress(params.referrer)) {
      return errorResponse('Invalid referrer address format', 400, origin);
    }

    // Build swap payload (using token IDs!)
    const swapPayload = {
      fromTokenId: params.fromTokenId,
      toTokenId: params.toTokenId,
      fromTokenAmount: params.fromTokenAmount,
      slippage: params.slippage || 1,
      userAddress: params.userAddress,
      referrer: params.referrer || '0x0000000000000000000000000000000000000000',
      partnerId: params.partnerId || 'brofit'
    };

    console.log('🔄 Executing swap:', {
      fromTokenId: swapPayload.fromTokenId,
      toTokenId: swapPayload.toTokenId,
      amount: swapPayload.fromTokenAmount,
      user: swapPayload.userAddress.substring(0, 10) + '...'
    });

    // Execute swap
    const data = await fetchJSON(`${ROCKETX_BASE_URL}/v1/swap`, {
      method: 'POST',
      headers: {
        'x-api': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(swapPayload),
      timeout: 30000, // 30 seconds (swaps can be slow)
      retries: 0, // Don't retry swaps (idempotency concerns)
      retryOn: []
    });

    console.log('✅ Swap executed successfully:', {
      requestId: data.requestId,
      hasTransactionData: !!data.transactionData
    });

    // Return swap response (includes requestId for tracking)
    return jsonResponse(data, 200, origin);

  } catch (error: any) {
    console.error('RocketX swap error:', error);

    // Handle timeout errors
    if (error.message.includes('timeout')) {
      return errorResponse('Swap timeout - transaction may still be processing. Check status with requestId.', 504, origin);
    }

    // Handle rate limiting
    if (error.message.includes('429')) {
      return errorResponse('Rate limit exceeded - please try again later', 429, origin);
    }

    // Handle HTTP errors
    if (error.message.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 500;

      // Try to extract error details from message
      let errorDetails = error.message;
      try {
        const jsonMatch = error.message.match(/\{.*\}/);
        if (jsonMatch) {
          const errorObj = JSON.parse(jsonMatch[0]);
          errorDetails = errorObj.message || errorObj.error || error.message;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }

      return errorResponse(`Swap failed: ${errorDetails}`, status, origin);
    }

    // Generic error
    return errorResponse('Failed to execute swap', 500, origin);
  }
}
