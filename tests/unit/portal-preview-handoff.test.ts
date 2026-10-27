import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPortalPreviewHandoff,
  readPortalPreviewHandoffTarget,
  verifyPortalPreviewHandoff,
} from '@/lib/admin/portal-preview-handoff';

describe('portal preview handoff', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'shared-test-signing-key');
    vi.stubEnv('PORTAL_PREVIEW_SIGNING_SECRET', 'legacy-test-signing-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('creates a signed handoff that remains valid for the default window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));

    const token = createPortalPreviewHandoff('admin-1', 'partner-1');
    vi.advanceTimersByTime(14 * 60 * 1000);

    expect(verifyPortalPreviewHandoff(token)?.targetId).toBe('partner-1');
  });

  it('lets an independently authenticated administrator recover an unexpired target', () => {
    const token = createPortalPreviewHandoff('admin-1', 'partner-1');
    const [payload] = token.split('.');

    expect(readPortalPreviewHandoffTarget(`${payload}.signature-from-another-service`)).toBe('partner-1');
  });

  it('rejects expired or malformed routing payloads', () => {
    const expiredPayload = Buffer.from(JSON.stringify({
      actorId: 'admin-1',
      targetId: 'partner-1',
      expiresAt: Date.now() - 1,
      nonce: 'nonce-1',
    })).toString('base64url');

    expect(readPortalPreviewHandoffTarget(`${expiredPayload}.different-signature`)).toBeNull();
    expect(readPortalPreviewHandoffTarget('not-a-token')).toBeNull();
  });
});
