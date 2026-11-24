/**
 * OpenHands correlation claim — pure helper for PR3 (#2524).
 *
 * Duplicate dispatch was possible when no correlation id was supplied: the
 * unique claim in ai_tasks (migration
 * 20261110123000_openhands_unique_correlation.sql, partial unique index on
 * correlation_id where tool_name = 'openhands.execute') only fires when a
 * correlation id exists. Every dispatch must therefore carry one; a missing
 * or blank id is replaced with a fresh UUID instead of being sent as null.
 *
 * Dependency-free on purpose: unit-tested without any database or provider.
 */
export function resolveOpenHandsCorrelationId(
  correlationId?: string | null,
): string {
  const trimmed = correlationId?.trim();
  if (trimmed) return trimmed;
  return globalThis.crypto.randomUUID();
}
