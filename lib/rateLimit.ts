/**
 * Rate Limiting Utility
 *
 * @deprecated Use the Redis-based rate limiter in lib/rate-limit.ts instead.
 * This in-memory implementation does NOT work in serverless/edge deployments
 * because each invocation may get a fresh instance, resetting all counters.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  limit: number;

  /**
   * Time window in milliseconds
   */
  window: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Usually IP address or user ID
 * @param config - Rate limit configuration
 * @returns Rate limit result with remaining requests
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, window: 60 * 1000 } // 100 requests per minute default
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  // Get or create rate limit entry
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 0,
      resetTime: now + config.window,
    };
  }

  // Increment counter
  store[key].count++;

  const remaining = Math.max(0, config.limit - store[key].count);
  const success = store[key].count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    reset: store[key].resetTime,
  };
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Strict: 10 requests per minute
   * Use for: Login attempts, password resets
   */
  STRICT: { limit: 10, window: 60 * 1000 },

  /**
   * Normal: 100 requests per minute
   * Use for: API endpoints, form submissions
   */
  NORMAL: { limit: 100, window: 60 * 1000 },

  /**
   * Generous: 1000 requests per minute
   * Use for: Public pages, static content
   */
  GENEROUS: { limit: 1000, window: 60 * 1000 },

  /**
   * Per Hour: 500 requests per hour
   * Use for: Expensive operations
   */
  HOURLY: { limit: 500, window: 60 * 60 * 1000 },
};

/**
 * Rate limit configurations for specific endpoints
 * Compatible with new API structure
 */
export const RATE_LIMITS = {
  /** Contact form: 5 requests per minute */
  CONTACT_FORM: { limit: 5, windowMs: 60_000 },

  /** Application forms: 3 requests per minute */
  APPLICATION_FORM: { limit: 3, windowMs: 60_000 },

  /** Organization invites: 10 requests per minute */
  ORG_INVITE: { limit: 10, windowMs: 60_000 },

  /** Search endpoints: 30 requests per minute */
  SEARCH: { limit: 30, windowMs: 60_000 },

  /** API endpoints (general): 60 requests per minute */
  API_GENERAL: { limit: 60, windowMs: 60_000 },

  /** Webhook endpoints: 100 requests per minute */
  WEBHOOK: { limit: 100, windowMs: 60_000 },

  /** Auth endpoints (login/signup): 5 requests per 5 minutes */
  AUTH: { limit: 5, windowMs: 5 * 60_000 },
} as const;

/**
 * Rate limit with new API interface (compatible with monitoring)
 * Converts windowMs to window for compatibility
 */
export function rateLimitNew(
  identifier: string,
  config: { limit: number; windowMs: number }
): { ok: boolean; remaining: number; resetAt?: number } {
  const result = rateLimit(identifier, {
    limit: config.limit,
    window: config.windowMs,
  });

  return {
    ok: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  };
}

/**
 * Get client identifier from request
 * Tries multiple sources to identify the client
 */
export function getClientIdentifier(headers: Headers): string {
  // Try to get real IP from various headers
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const cfConnectingIp = headers.get("cf-connecting-ip"); // Cloudflare

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to user agent hash (less reliable)
  const userAgent = headers.get("user-agent") || "unknown";
  return `ua:${hashString(userAgent)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create rate limit headers for HTTP response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
    "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
  };
}
