import { describe, expect, it } from 'vitest';
import { tenantSlugFromSiteReferrer } from '@/lib/tenant/resolve-public-tenant';
describe('public website preview request context', () => {
  it('resolves contact and analytics requests from a same-host published-site path', () => {
    expect(tenantSlugFromSiteReferrer('www.elevateforhumanity.org', 'https://www.elevateforhumanity.org/sites/meri-gold-round/contact?product=soap')).toBe('meri-gold-round');
  });
  it('rejects a foreign host, insecure protocol, missing referrer and unrelated platform page', () => {
    expect(tenantSlugFromSiteReferrer('www.elevateforhumanity.org', 'https://attacker.example/sites/meri-gold-round')).toBeNull();
    expect(tenantSlugFromSiteReferrer('www.elevateforhumanity.org', 'http://www.elevateforhumanity.org/sites/meri-gold-round')).toBeNull();
    expect(tenantSlugFromSiteReferrer('www.elevateforhumanity.org', null)).toBeNull();
    expect(tenantSlugFromSiteReferrer('www.elevateforhumanity.org', 'https://www.elevateforhumanity.org/contact')).toBeNull();
  });
  it('does not allow an arbitrary customer host to select a different tenant by path', () => {
    expect(tenantSlugFromSiteReferrer('customer.example', 'https://customer.example/sites/other-tenant')).toBeNull();
  });
  it('does not accept encoded separators or a partial slug match', () => {
    expect(tenantSlugFromSiteReferrer('www.elevateforhumanity.org', 'https://www.elevateforhumanity.org/sites/meri%2Fother')).toBeNull();
    expect(tenantSlugFromSiteReferrer('www.elevateforhumanity.org', 'https://www.elevateforhumanity.org/sites/meri_other')).toBeNull();
  });
});
