// Pure security event classification — no server-only imports.
// Imported by both lib/actions/security.ts (server action) and tests.

export const CRITICAL_EVENTS = new Set(['AUTOMATION_DETECTED', 'IFRAME_EMBEDDING_DETECTED']);

export function getSeverity(eventType: string): string {
  if (CRITICAL_EVENTS.has(eventType)) return 'critical';
  if (['RAPID_NAVIGATION', 'CONSOLE_ACCESS'].includes(eventType)) return 'high';
  return 'medium';
}
