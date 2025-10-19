/**
 * Input validation utilities for Edge Functions
 * Prevents injection attacks and ensures data integrity
 */

// Ethereum address validation (0x + 40 hex chars)
export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Transaction hash validation (0x + 64 hex chars)
export function isValidTxHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') return false;
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

// Chain ID validation (positive integer)
export function isValidChainId(chainId: string | number): boolean {
  const id = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  return Number.isInteger(id) && id > 0 && id < 1000000;
}

// Token amount validation (positive number with max 18 decimals)
export function isValidAmount(amount: string | number): boolean {
  if (typeof amount === 'number') {
    return amount > 0 && isFinite(amount);
  }
  if (typeof amount !== 'string') return false;
  const num = parseFloat(amount);
  if (!isFinite(num) || num <= 0) return false;
  // Check decimal places (max 18 for ETH precision)
  const parts = amount.split('.');
  if (parts.length === 2 && parts[1].length > 18) return false;
  return true;
}

// Token symbol validation (1-10 alphanumeric chars)
export function isValidTokenSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  return /^[a-zA-Z0-9]{1,10}$/.test(symbol);
}

// Validate multiple addresses at once
export function validateAddresses(addresses: string[]): { valid: boolean; invalid: string[] } {
  const invalid = addresses.filter(addr => !isValidAddress(addr));
  return {
    valid: invalid.length === 0,
    invalid
  };
}

// Supported chain IDs (allowlist)
const SUPPORTED_CHAINS = [
  1,      // Ethereum
  137,    // Polygon
  56,     // BNB Chain
  42161,  // Arbitrum
  10,     // Optimism
  43114,  // Avalanche
  250,    // Fantom
  100,    // Gnosis
  1284,   // Moonbeam
  1285    // Moonriver
];

export function isSupportedChain(chainId: number): boolean {
  return SUPPORTED_CHAINS.includes(chainId);
}

// URL parameter sanitization
export function sanitizeUrlParam(param: string, maxLength: number = 255): string {
  if (!param || typeof param !== 'string') return '';
  // Remove potentially dangerous characters
  return param.slice(0, maxLength).replace(/[<>\"'&]/g, '');
}

// Validate query parameters for API requests
export interface QueryParams {
  address?: string;
  chainId?: string | number;
  amount?: string | number;
  tokenSymbol?: string;
  [key: string]: any;
}

export function validateQueryParams(params: QueryParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.address && !isValidAddress(params.address)) {
    errors.push('Invalid Ethereum address format');
  }

  if (params.chainId !== undefined) {
    const chainId = typeof params.chainId === 'string' ? parseInt(params.chainId, 10) : params.chainId;
    if (!isValidChainId(chainId)) {
      errors.push('Invalid chain ID');
    } else if (!isSupportedChain(chainId)) {
      errors.push(`Chain ID ${chainId} is not supported`);
    }
  }

  if (params.amount !== undefined && !isValidAmount(params.amount)) {
    errors.push('Invalid amount format');
  }

  if (params.tokenSymbol && !isValidTokenSymbol(params.tokenSymbol)) {
    errors.push('Invalid token symbol format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
