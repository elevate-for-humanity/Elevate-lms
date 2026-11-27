import { describe, expect, it } from 'vitest';
import { prepareCleaningProviderOnboardingConfig, prepareCleaningSiteConfig } from '@/lib/cleaning/site-config';
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
  it('prepares only provider onboarding while preserving disabled commerce and all existing site content', () => {
    const source = { ...existing, homepage: { heroTitle: 'Cleaning services', heroSubtitle: 'Local team', heroCtaText: 'Contact us', heroCtaHref: '/contact', features: [] }, meta: { existingKey: true, cleaningNetworkEnabled: false } } as TenantSiteConfig;
    const once = prepareCleaningProviderOnboardingConfig(source, true);
    expect(prepareCleaningProviderOnboardingConfig(once, true)).toEqual(once);
    expect(once.pages?.map(page => page.slug)).toEqual(['/join-network', '/provider']);
    expect(once.meta).toEqual({ existingKey: true, cleaningNetworkEnabled: false, cleaningProviderOnboardingEnabled: true });
    expect(once.contact).toEqual(source.contact);
    expect(once.homepage).toEqual(source.homepage);
    expect(source.pages).toHaveLength(1);
    expect(once.pages![0].sections[0].content.fields).toEqual([
      { name: 'email', label: 'Email' },
      { name: 'requested_hourly_rate', type: 'provider_rate', label: 'Requested pay per cleaner-hour (USD)', required: false },
    ]);
  });
  it('does not enable onboarding by default or overwrite an unrelated provider page', () => {
    expect(prepareCleaningProviderOnboardingConfig(existing).meta?.cleaningProviderOnboardingEnabled).toBe(false);
    const conflict = structuredClone(existing);
    conflict.pages!.push({ id: 'other', slug: '/provider', title: 'Other', sections: [] });
    expect(() => prepareCleaningProviderOnboardingConfig(conflict, true)).toThrow(/reconciliation/);
    const fullForm = structuredClone(existing);
    fullForm.pages![0].sections[0].content.fields = Array.from({ length: 20 }, (_, index) => ({ name: `existing_${index}` }));
    expect(() => prepareCleaningProviderOnboardingConfig(fullForm, true)).toThrow(/field limit/);
  });
});
