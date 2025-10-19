/**
 * Fetch utilities with timeout and retry logic
 * Prevents hanging requests and handles transient failures
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryOn?: number[]; // HTTP status codes to retry on
}

/**
 * Fetch with timeout using AbortController
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 10000, // 10 seconds default
    retries = 1,
    retryDelay = 1000,
    retryOn = [429, 500, 502, 503, 504],
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if we should retry based on status code
      if (attempt < retries && retryOn.includes(response.status)) {
        const jitter = Math.random() * 500; // Add jitter to prevent thundering herd
        await sleep(retryDelay + jitter);
        continue;
      }

      return response;

    } catch (error: any) {
      clearTimeout(timeoutId);

      // Don't retry on abort (timeout)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      lastError = error;

      // Retry on network errors if we have attempts left
      if (attempt < retries) {
        const jitter = Math.random() * 500;
        await sleep(retryDelay + jitter);
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch JSON with timeout and validation
 */
export async function fetchJSON<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data as T;
}

/**
 * POST JSON with timeout and retry
 */
export async function postJSON<T = any>(
  url: string,
  body: any,
  options: FetchOptions = {}
): Promise<T> {
  return fetchJSON<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

/**
 * Batch fetch with concurrency limit
 */
export async function batchFetch<T>(
  urls: string[],
  options: FetchOptions = {},
  concurrency: number = 5
): Promise<T[]> {
  const results: T[] = [];
  const queue = [...urls];

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;

      try {
        const data = await fetchJSON<T>(url, options);
        results.push(data);
      } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        // Continue with other requests even if one fails
      }
    }
  });

  await Promise.all(workers);
  return results;
}
