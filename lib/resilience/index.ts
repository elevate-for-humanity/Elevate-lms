/**
 * lib/resilience/index.ts
 *
 * Centralized retry and circuit breaker utilities.
 *
 * Usage:
 *   import { withRetry, CircuitBreaker } from '@/lib/resilience';
 *
 *   // Simple retry
 *   const data = await withRetry(() => fetch('/api/something'), { attempts: 3 });
 *
 *   // Circuit breaker (singleton per service)
 *   const stripe = CircuitBreaker.for('stripe');
 *   const result = await stripe.call(() => stripe.charges.create(...));
 */

import { logger } from '@/lib/logger';

// ── withRetry ─────────────────────────────────────────────────────────────────

export interface RetryOptions {
  /** Max attempts including the first call. Default: 3 */
  attempts?: number;
  /** Base delay in ms. Doubles each attempt (exponential backoff). Default: 500 */
  baseDelayMs?: number;
  /** Max delay cap in ms. Default: 10000 */
  maxDelayMs?: number;
  /** Jitter factor 0–1 added to delay to prevent thundering herd. Default: 0.2 */
  jitter?: number;
  /** Return true to retry on this error. Default: retry on all errors */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Called on each failed attempt before retry */
  onRetry?: (error: unknown, attempt: number) => void;
  /** Label for logging */
  label?: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    attempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 10_000,
    jitter = 0.2,
    shouldRetry = () => true,
    onRetry,
    label = 'withRetry',
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === attempts || !shouldRetry(err, attempt)) {
        throw err;
      }

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitterMs = delay * jitter * Math.random();
      const wait = Math.round(delay + jitterMs);

      logger.warn(`[${label}] attempt ${attempt}/${attempts} failed, retrying in ${wait}ms`, {
        error: err instanceof Error ? err.message : String(err),
      });

      onRetry?.(err, attempt);
      await sleep(wait);
    }
  }

  throw lastError;
}

// ── CircuitBreaker ────────────────────────────────────────────────────────────

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Failures before opening the circuit. Default: 5 */
  failureThreshold?: number;
  /** Successes in half-open state before closing. Default: 2 */
  successThreshold?: number;
  /** Ms to wait in open state before trying half-open. Default: 30000 */
  resetTimeoutMs?: number;
  /** Called when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState, name: string) => void;
}

export class CircuitBreaker {
  private static instances = new Map<string, CircuitBreaker>();

  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private openedAt: number | null = null;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly onStateChange?: CircuitBreakerOptions['onStateChange'];

  constructor(
    private readonly name: string,
    options: CircuitBreakerOptions = {},
  ) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 2;
    this.resetTimeoutMs   = options.resetTimeoutMs   ?? 30_000;
    this.onStateChange    = options.onStateChange;
  }

  /** Get or create a named circuit breaker singleton */
  static for(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!CircuitBreaker.instances.has(name)) {
      CircuitBreaker.instances.set(name, new CircuitBreaker(name, options));
    }
    return CircuitBreaker.instances.get(name)!;
  }

  /** Reset all circuit breakers (useful in tests) */
  static resetAll(): void {
    CircuitBreaker.instances.clear();
  }

  getState(): CircuitState { return this.state; }
  getFailures(): number    { return this.failures; }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    this.maybeTransitionFromOpen();

    if (this.state === 'open') {
      throw new CircuitOpenError(this.name, this.resetTimeoutMs);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      throw err;
    }
  }

  private maybeTransitionFromOpen(): void {
    if (this.state === 'open' && this.openedAt !== null) {
      if (Date.now() - this.openedAt >= this.resetTimeoutMs) {
        this.transition('half-open');
        this.successes = 0;
      }
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.failures = 0;
        this.transition('closed');
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(err: unknown): void {
    this.failures++;
    logger.warn(`[circuit-breaker:${this.name}] failure ${this.failures}/${this.failureThreshold}`, {
      error: err instanceof Error ? err.message : String(err),
      state: this.state,
    });

    if (this.state === 'half-open' || this.failures >= this.failureThreshold) {
      this.openedAt = Date.now();
      this.transition('open');
    }
  }

  private transition(to: CircuitState): void {
    const from = this.state;
    this.state = to;
    logger.info(`[circuit-breaker:${this.name}] ${from} → ${to}`);
    this.onStateChange?.(from, to, this.name);
  }
}

export class CircuitOpenError extends Error {
  constructor(name: string, resetMs: number) {
    super(`Circuit "${name}" is open. Retry after ${resetMs / 1000}s.`);
    this.name = 'CircuitOpenError';
  }
}

// ── withResilience ────────────────────────────────────────────────────────────
// Combines retry + circuit breaker in one call.

export interface ResilienceOptions extends RetryOptions {
  circuitBreaker?: CircuitBreaker;
}

export async function withResilience<T>(
  fn: () => Promise<T>,
  options: ResilienceOptions = {},
): Promise<T> {
  const { circuitBreaker, ...retryOptions } = options;

  const wrapped = circuitBreaker
    ? () => circuitBreaker.call(fn)
    : fn;

  return withRetry(wrapped, {
    ...retryOptions,
    // Don't retry if the circuit is open — it will stay open
    shouldRetry: (err, attempt) => {
      if (err instanceof CircuitOpenError) return false;
      return retryOptions.shouldRetry?.(err, attempt) ?? true;
    },
  });
}

// ── Pre-wired breakers for known external services ────────────────────────────

export const breakers = {
  stripe:   CircuitBreaker.for('stripe',   { failureThreshold: 3, resetTimeoutMs: 60_000 }),
  openai:   CircuitBreaker.for('openai',   { failureThreshold: 5, resetTimeoutMs: 30_000 }),
  sendgrid: CircuitBreaker.for('sendgrid', { failureThreshold: 3, resetTimeoutMs: 60_000 }),
  supabase: CircuitBreaker.for('supabase', { failureThreshold: 5, resetTimeoutMs: 15_000 }),
  groq:     CircuitBreaker.for('groq',     { failureThreshold: 5, resetTimeoutMs: 30_000 }),
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
