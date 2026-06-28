export const CRITICAL_EVENTS = new Set(['AUTOMATION_DETECTED', 'IFRAME_EMBEDDING_DETECTED', 'TOKEN_EXFILTRATION_ATTEMPT', 'UNAUTHORIZED_ADMIN_ACCESS']);

/**
 * Maps a security event type to a severity tier.
 */
export function getSeverity(eventType: string): 'critical' | 'high' | 'medium' | 'low' {
  if (CRITICAL_EVENTS.has(eventType)) return 'critical';
  
  const highEvents = ['RAPID_NAVIGATION', 'CONSOLE_ACCESS', 'DEVTOOLS_OPENED', 'GEO_ANOMALY'];
  if (highEvents.includes(eventType)) return 'high';
  
  const mediumEvents = ['CLIPBOARD_PASTE', 'RESOURCE_LOAD_FAILED', 'INVALID_FORM_SUBMISSION'];
  if (mediumEvents.includes(eventType)) return 'medium';
  
  return 'low';
}

export const securityUtils = { 
  sanitize: (s: string) => s.replace(/[<>]/g, ''),
  getSeverity 
};
