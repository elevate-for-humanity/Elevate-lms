/** Errors where callers should use offline / rule-based fallbacks instead of failing the request. */
export function isAiDegradedError(err: unknown): boolean {
  try {
    // Check for circuit breaker open state (dynamic import to avoid bundling issues)
    if (typeof err === 'object' && err !== null && 'name' in err) {
      const errObj = err as { name?: string; message?: string };
      if (errObj.name === 'CircuitOpenError') return true;
    }
    
    if (err instanceof Error) {
      return (
        err.message.includes('No AI chat provider available') ||
        err.message.includes('All AI chat providers failed')
      );
    }
  } catch {
    // Ignore errors in the error checker itself
  }
  return false;
}
