import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { CLEANING_MEMBERSHIP } from './pricing';

/** Apply only after the matching renderer is deployed. Preserves unrelated content. */
export function prepareCleaningSiteConfig(current: TenantSiteConfig): TenantSiteConfig {
  const config = structuredClone(current);
  if (!config.pages?.some(page => page.slug === '/join-network')) throw new Error('Cleaning network application page is required.');
  const application = config.pages.find(page => page.slug === '/join-network')!;
  for (const section of application.sections) {
    if (section.type !== 'contact_form' || !Array.isArray(section.content.fields)) continue;
    const fields = section.content.fields as Array<Record<string, unknown>>;
    if (fields.some(field => field.name === 'requested_hourly_rate')) continue;
    if (fields.length >= 20) throw new Error('Application field limit reached. Review before adding hourly pay.');
    fields.push({ name: 'requested_hourly_rate', type: 'provider_rate', label: 'Requested pay per cleaner-hour (USD)', required: false });
  }
  const membershipPage = config.pages.find(page => page.slug === '/memberships');
  if (membershipPage && !membershipPage.sections.some(section => section.type === 'cleaning_membership'))
    throw new Error('An existing membership page needs manual reconciliation.');
  if (!membershipPage) config.pages.push({
    id: 'cleaning-memberships', slug: '/memberships', title: 'Cleaning Membership', navLabel: 'Membership', showInNavigation: true,
    seo: { title: 'Cleaning Membership | 2Exclusive Platinum Cleaning', description: 'Compare pay-as-you-go cleaning with the optional $19 monthly Platinum Cleaning Membership.' },
    sections: [{ id: 'cleaning-membership-plans', type: 'cleaning_membership', visible: true, content: {}, settings: {} }],
  });
  config.meta = { ...config.meta, cleaningMembershipPlan: { ...CLEANING_MEMBERSHIP, collectionMode: 'manual_invoice', activation: 'verified_payment_required' } };
  return config;
}
