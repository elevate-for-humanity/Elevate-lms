import { describe, expect, it } from 'vitest';
import { publishingReadinessError } from '@/lib/social/publishing-readiness';

const account = {
  enabled: true,
  connection_status: 'verified_read_only',
  organization_id: 'page-123',
  granted_scopes: ['pages_manage_posts', 'instagram_basic', 'instagram_content_publish'],
};

describe('social publishing activation', () => {
  it('allows verified Meta accounts with publishing permissions', () => {
    expect(publishingReadinessError('facebook', account)).toBeNull();
    expect(publishingReadinessError('instagram', account)).toBeNull();
  });
  it('blocks unconnected and disabled accounts', () => {
    expect(publishingReadinessError('facebook', null)).toBeTruthy();
    expect(publishingReadinessError('facebook', { ...account, enabled: false })).toBeTruthy();
    expect(
      publishingReadinessError('facebook', { ...account, organization_id: null }),
    ).toBeTruthy();
    expect(
      publishingReadinessError('facebook', { ...account, connection_status: 'unverified' }),
    ).toBeTruthy();
  });
  it('blocks missing publishing permissions', () => {
    expect(
      publishingReadinessError('facebook', {
        ...account,
        granted_scopes: ['pages_read_engagement'],
      }),
    ).toContain('permissions');
    expect(
      publishingReadinessError('instagram', { ...account, granted_scopes: ['instagram_basic'] }),
    ).toContain('permissions');
  });
  it('blocks expired, invalid, and boundary-expired credentials', () => {
    const now = Date.parse('2026-10-08T15:00:00Z');
    for (const expires_at of ['invalid', '2026-10-08T14:59:59Z', '2026-10-08T15:00:00Z']) {
      expect(publishingReadinessError('facebook', { ...account, expires_at }, now)).toContain(
        'expired',
      );
    }
    expect(
      publishingReadinessError('facebook', { ...account, expires_at: '2026-10-08T15:00:01Z' }, now),
    ).toBeNull();
  });
  it('does not activate platforms without a publishing handler', () => {
    expect(publishingReadinessError('linkedin', account)).toContain('handler');
    expect(publishingReadinessError('youtube', account)).toContain('handler');
  });
});
