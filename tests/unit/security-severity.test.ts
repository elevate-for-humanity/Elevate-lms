/**
 * Unit tests for getSeverity — security event classification logic.
 *
 * getSeverity maps event type strings to severity tiers used when writing
 * audit_log rows. The tiers drive alerting and retention policy, so
 * misclassification has operational consequences.
 */

import { describe, it, expect } from 'vitest';
import { getSeverity } from '../../lib/security-utils';

describe('getSeverity', () => {
  it('returns critical for AUTOMATION_DETECTED', () => {
    expect(getSeverity('AUTOMATION_DETECTED')).toBe('critical');
  });

  it('returns critical for IFRAME_EMBEDDING_DETECTED', () => {
    expect(getSeverity('IFRAME_EMBEDDING_DETECTED')).toBe('critical');
  });

  it('returns high for RAPID_NAVIGATION', () => {
    expect(getSeverity('RAPID_NAVIGATION')).toBe('high');
  });

  it('returns high for CONSOLE_ACCESS', () => {
    expect(getSeverity('CONSOLE_ACCESS')).toBe('high');
  });

  it('returns medium for any unrecognised event type', () => {
    expect(getSeverity('DEVTOOLS_OPENED')).toBe('medium');
    expect(getSeverity('RESOURCE_LOAD_FAILED')).toBe('medium');
    expect(getSeverity('CLIPBOARD_PASTE')).toBe('medium');
    expect(getSeverity('UNKNOWN_EVENT')).toBe('medium');
    expect(getSeverity('')).toBe('medium');
  });
});
