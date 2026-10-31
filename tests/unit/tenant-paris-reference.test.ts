import { describe, expect, it } from 'vitest';
import { buildTenantParisPublicReference } from '@/lib/tenant/paris-public-reference';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';

describe('bounded public tenant PARIS context', () => {
  it('keeps a large site inside the owned model context while retaining the relevant service section', () => {
    const config = buildDefaultSiteConfig({ organizationName: 'Owner Test Cleaning' });
    config.pages = [{ id: 'home', slug: '/', title: 'Home', sections: Array.from({ length: 40 }, (_, i) => ({ id: `large-${i}`, type: 'rich_text' as const, content: { text: 'General business information. '.repeat(120) } })) }, { id: 'services', slug: '/services', title: 'Cleaning services', sections: [{ id: 'carpet', type: 'rich_text', content: { title: 'Carpet cleaning', text: 'We clean carpets and upholstery.' } }] }];
    const result = buildTenantParisPublicReference(config, 'Which carpet cleaning services do you provide?');
    expect(result.length).toBeLessThanOrEqual(8000);
    expect(result).toContain('We clean carpets and upholstery.');
    expect(() => JSON.parse(result)).not.toThrow();
  });
  it('does not include hidden sections or private configuration metadata', () => {
    const config = buildDefaultSiteConfig({ organizationName: 'Owner Test' });
    config.meta = { private: 'PRIVATE_MARKER' };
    config.pages = [{ id: 'home', title: 'Home', slug: '/', sections: [{ id: 'visible', type: 'rich_text', content: { text: 'Public services' } }, { id: 'hidden', type: 'rich_text', visible: false, content: { text: 'PRIVATE_DRAFT' } }] }];
    const result = buildTenantParisPublicReference(config, 'Tell me about PRIVATE_MARKER PRIVATE_DRAFT');
    expect(result).toContain('Public services'); expect(result).not.toContain('PRIVATE_MARKER'); expect(result).not.toContain('PRIVATE_DRAFT');
  });
});
