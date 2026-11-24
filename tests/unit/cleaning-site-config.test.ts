import { describe, expect, it } from 'vitest';
import { prepareCleaningSiteConfig } from '@/lib/cleaning/site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
const existing = { pages: [{ id: 'join', slug: '/join-network', title: 'Apply', sections: [{ id: 'form', type: 'contact_form', content: { fields: [{ name: 'email', label: 'Email' }] } }] }], contact: { address: '120 E Market Street, Suite 560, Indianapolis, IN 46204' }, meta: { existingKey: true } } as unknown as TenantSiteConfig;
describe('cleaning launch configuration', () => {
  it('preserves the address and existing fields, and is idempotent', () => {
    const once = prepareCleaningSiteConfig(existing);
    expect(prepareCleaningSiteConfig(once)).toEqual(once);
    expect(once.contact).toEqual(existing.contact);
    expect(once.meta?.existingKey).toBe(true);
    expect(once.pages?.find(page => page.slug === '/memberships')).toBeTruthy();
    expect(existing.pages).toHaveLength(1);
  });
  it('refuses to overwrite unrelated memberships or silently lose form fields', () => {
    const conflict = structuredClone(existing);
    conflict.pages!.push({ id: 'other', slug: '/memberships', title: 'Other', sections: [] });
    expect(() => prepareCleaningSiteConfig(conflict)).toThrow(/reconciliation/);
    expect(() => prepareCleaningSiteConfig({ ...existing, pages: [] })).toThrow(/required/);
  });
});
