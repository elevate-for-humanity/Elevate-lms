import { describe, it, expect } from 'vitest';
import { tenantPublicSiteUrl, tenantAdminUrl } from '@/lib/tenant/public-site-url';

describe('tenantPublicSiteUrl', () => {
  it('builds subdomain host URLs', () => {
    expect(tenantPublicSiteUrl('acme-training')).toBe(
      'https://acme-training.app.elevateforhumanity.org',
    );
    expect(tenantPublicSiteUrl('acme-training', '/programs')).toBe(
      'https://acme-training.app.elevateforhumanity.org/programs',
    );
  });

  it('builds admin paths on tenant host', () => {
    expect(tenantAdminUrl('acme-training')).toBe(
      'https://acme-training.app.elevateforhumanity.org/admin/dashboard',
    );
  });
});
