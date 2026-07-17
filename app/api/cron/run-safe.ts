/**
 * runSafe — structured error boundary for cron job functions.
 *
 * Wraps any async cron function with:
 *   - Structured start/success/failure logging via logger
 *   - Duration tracking
 *   - Re-throws on failure so the HTTP handler can return 500
 */
import { logger } from '@/lib/logger';

export async function runSafe(
  name: string,
  fn: () => Promise<Record<string, unknown> | void>,
): Promise<Record<string, unknown>> {
  const start = Date.now();
  logger.info(`[CRON START] ${name}`);
  try {
    const result = (await fn()) ?? {};
    const duration_ms = Date.now() - start;
    logger.info(`[CRON SUCCESS] ${name}`, { duration_ms, ...result });
    return { duration_ms, ...result };
  } catch (error) {
    const duration_ms = Date.now() - start;
    logger.error(`[CRON FAILED] ${name}`, { duration_ms, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
