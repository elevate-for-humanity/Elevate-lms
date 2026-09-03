/**
 * lib/resilience/with-resilience.ts
 *
 * Key-based resilience wrapper — circuit breaker + retry in one call.
 * Delegates to the pre-wired `breakers` singletons in lib/resilience/index.ts
 * so circuit state is shared across all callers within the same process.
 *
 * Usage:
 *   import { withResilience } from '@/lib/resilience/with-resilience';
 *
 *   const result = await withResilience('openai',   () => openai.chat(...));
 *   const charge  = await withResilience('stripe',   () => stripe.charges.create(...));
 *   const email   = await withResilience('sendgrid', () => sendEmail(...));
 */

import {
  withRetry,
  CircuitBreaker,
  breakers,
  type RetryOptions,
  type CircuitBreakerOptions,
} from './index';

export interface ResilienceOptions {
  retry?: Partial<RetryOptions>;
  circuit?: Partial<CircuitBreakerOptions>;
}

const RETRY_DEFAULTS: Record<string, Partial<RetryOptions>> = {
  openai:   { attempts: 2, baseDelayMs: 1000 },
  groq:     { attempts: 2, baseDelayMs: 500  },
  gemini:   { attempts: 2, baseDelayMs: 500  },
  stripe:   { attempts: 3, baseDelayMs: 300  },
  sendgrid: { attempts: 3, baseDelayMs: 500  },
  supabase: { attempts: 2, baseDelayMs: 200  },
};

const CIRCUIT_DEFAULTS: Record<string, CircuitBreakerOptions> = {
  gemini: { failureThreshold: 5, resetTimeoutMs: 20_000 },
};

function getBreakerForKey(key: string, opts?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  if (key in breakers) return (breakers as Record<string, CircuitBreaker>)[key];
  return CircuitBreaker.for(key, { ...CIRCUIT_DEFAULTS[key], ...opts });
}

export async function withResilience<T>(
  key: string,
  fn: () => Promise<T>,
  options: ResilienceOptions = {},
): Promise<T> {
  const retryOpts: RetryOptions = {
    attempts: 3,
    baseDelayMs: 500,
    label: key,
    ...RETRY_DEFAULTS[key],
    ...options.retry,
  };
  const breaker = getBreakerForKey(key, options.circuit);
  return breaker.call(() => withRetry(fn, retryOpts));
}

export const resilientOpenAI   = <T>(fn: () => Promise<T>, opts?: ResilienceOptions) => withResilience('openai',   fn, opts);
export const resilientGroq     = <T>(fn: () => Promise<T>, opts?: ResilienceOptions) => withResilience('groq',     fn, opts);
export const resilientGemini   = <T>(fn: () => Promise<T>, opts?: ResilienceOptions) => withResilience('gemini',   fn, opts);
export const resilientStripe   = <T>(fn: () => Promise<T>, opts?: ResilienceOptions) => withResilience('stripe',   fn, opts);
export const resilientSendGrid = <T>(fn: () => Promise<T>, opts?: ResilienceOptions) => withResilience('sendgrid', fn, opts);
export const resilientSupabase = <T>(fn: () => Promise<T>, opts?: ResilienceOptions) => withResilience('supabase', fn, opts);
