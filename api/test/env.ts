/**
 * Test endpoint to verify environment variables are set
 */

import { jsonResponse } from '../utils/cors';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const envStatus = {
    ROCKETX_API_KEY: !!process.env.ROCKETX_API_KEY ? 'SET' : 'MISSING',
    MORALIS_API_KEY: !!process.env.MORALIS_API_KEY ? 'SET' : 'MISSING',
    COINGECKO_API_KEY: !!process.env.COINGECKO_API_KEY ? 'SET' : 'MISSING',
    ALLOWED_ORIGINS: !!process.env.ALLOWED_ORIGINS ? 'SET' : 'MISSING',
    COINGECKO_VALUE_LENGTH: process.env.COINGECKO_API_KEY?.length || 0,
    COINGECKO_STARTS_WITH: process.env.COINGECKO_API_KEY?.substring(0, 5) || 'N/A'
  };

  return jsonResponse(envStatus, 200);
}
