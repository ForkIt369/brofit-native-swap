/**
 * Test endpoint to check CoinGecko URL construction
 */

import { jsonResponse } from '../utils/cors';

export const config = {
  runtime: 'edge',
};

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export default async function handler(request: Request) {
  const apiKey = process.env.COINGECKO_API_KEY;

  // Build the same URL as the real endpoint
  const coinGeckoUrl = new URL(`${COINGECKO_BASE_URL}/simple/price`);
  coinGeckoUrl.searchParams.set('ids', 'ethereum,bitcoin');
  coinGeckoUrl.searchParams.set('vs_currencies', 'usd');
  coinGeckoUrl.searchParams.set('include_24hr_change', 'true');
  coinGeckoUrl.searchParams.set('include_market_cap', 'true');
  coinGeckoUrl.searchParams.set('include_24hr_vol', 'true');
  coinGeckoUrl.searchParams.set('x_cg_demo_api_key', apiKey || 'MISSING');

  return jsonResponse({
    apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING',
    apiKeyLength: apiKey?.length || 0,
    constructedUrl: coinGeckoUrl.toString(),
    params: Object.fromEntries(coinGeckoUrl.searchParams)
  }, 200);
}
