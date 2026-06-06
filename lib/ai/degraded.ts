import { CircuitOpenError } from '@/lib/resilience';

/** Errors where callers should use offline / rule-based fallbacks instead of failing the request. */
export function isAiDegradedError(err: unknown): boolean {
  if (err instanceof CircuitOpenError) return true;
  if (err instanceof Error) {
    return (
      err.message.includes('No AI chat provider available') ||
      err.message.includes('All AI chat providers failed')
    );
  }
  return false;
}
