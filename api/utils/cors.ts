/**
 * CORS utilities for Edge Functions
 * Allows embedding from any site while maintaining security
 */

export interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Max-Age'?: string;
}

/**
 * Get CORS headers for responses
 * Allows embedding from any origin for now
 */
export function getCorsHeaders(origin?: string): CorsHeaders {
  const allowedOrigin = process.env.ALLOWED_ORIGINS === '*' ? '*' : (origin || '*');

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400' // 24 hours
  };
}

/**
 * Handle OPTIONS preflight requests
 */
export function handlePreflight(request: Request): Response {
  const origin = request.headers.get('origin') || undefined;
  const corsHeaders = getCorsHeaders(origin);

  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(
  data: any,
  status: number = 200,
  origin?: string
): Response {
  const corsHeaders = getCorsHeaders(origin);

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Create an error response with CORS headers
 */
export function errorResponse(
  message: string,
  status: number = 400,
  origin?: string
): Response {
  return jsonResponse(
    { error: message, status },
    status,
    origin
  );
}

/**
 * Validate origin against allowlist (future enhancement)
 * Currently allows all origins per user requirement
 */
export function isAllowedOrigin(origin: string | null): boolean {
  // Allow all origins for now ("embeddable on any site")
  if (process.env.ALLOWED_ORIGINS === '*') return true;

  // Future: implement allowlist logic
  if (!origin) return false;

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
  return allowedOrigins.includes(origin);
}
