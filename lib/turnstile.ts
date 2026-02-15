import { logger } from '@/lib/logger';
/**
 * CLOUDFLARE TURNSTILE VERIFICATION
 *
 * Server-side verification for Turnstile tokens
 * Free, privacy-friendly CAPTCHA alternative
 */

export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
}

/**
 * Verify Turnstile token
 *
 * @param token - Token from client-side Turnstile widget
 * @param ip - Optional IP address for additional verification
 * @returns Verification result
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string
): Promise<TurnstileVerificationResult> {
  try {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      return { success: true }; // Allow in development
    }

    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!data.success) {
      logger.error('❌ Turnstile verification failed:', data['error-codes']);
      return {
        success: false,
        error: 'Verification failed. Please try again.',
      };
    }

    return { success: true };
  } catch (error) { /* Error handled silently */ 
    logger.error('❌ Turnstile verification error:', error);
    return {
      success: false,
      error: 'Verification error. Please try again.',
    };
  }
}

/**
 * Rate limiting helper
 * Simple in-memory rate limiter (use Redis in production)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    // New window
    const resetAt = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Clean up expired rate limit records (call periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
