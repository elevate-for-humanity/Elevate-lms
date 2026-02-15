import { logger } from '@/lib/logger';
/**
 * Spam protection utilities
 * Rate limiting and honeypot fields
 */

// Simple rate limiting (in-memory, production should use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(identifier: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Honeypot field validation
export function validateHoneypot(honeypotValue: string | null | undefined): boolean {
  // Honeypot should be empty (bots fill it)
  return !honeypotValue || honeypotValue.trim() === '';
}

// Time-based validation (form should take at least X seconds to fill)
export function validateFormTiming(startTime: number, minSeconds = 3): boolean {
  const elapsed = (Date.now() - startTime) / 1000;
  return elapsed >= minSeconds;
}

// Cloudflare Turnstile verification
export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    return true; // Allow in development
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) { /* Error handled silently */ 
    logger.error('Turnstile verification error:', error);
    return false;
  }
}

// Combined spam check
export async function validateSubmission(data: {
  identifier: string; // IP or user ID
  honeypot?: string;
  startTime?: number;
  turnstileToken?: string;
}): Promise<{ valid: boolean; reason?: string }> {
  // Rate limit check
  if (!checkRateLimit(data.identifier)) {
    return { valid: false, reason: 'Rate limit exceeded. Please try again later.' };
  }

  // Honeypot check
  if (data.honeypot !== undefined && !validateHoneypot(data.honeypot)) {
    return { valid: false, reason: 'Invalid submission detected.' };
  }

  // Timing check
  if (data.startTime !== undefined && !validateFormTiming(data.startTime)) {
    return { valid: false, reason: 'Form submitted too quickly.' };
  }

  // Turnstile check
  if (data.turnstileToken) {
    const turnstileValid = await verifyTurnstile(data.turnstileToken);
    if (!turnstileValid) {
      return { valid: false, reason: 'Verification failed. Please try again.' };
    }
  }

  return { valid: true };
}
