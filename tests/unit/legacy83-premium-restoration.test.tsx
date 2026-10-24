import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import { validateSiteConfig } from '@/lib/tenant/site-validation';
import { restoreLegacy83Premium } from '../../scripts/restore-legacy83-premium.mjs';

afterEach(cleanup);

function fixture() {
  const config = buildDefaultSiteConfig({ organizationName: 'Legacy 83 Business' });
  config.template.id = 'legacy83-premium';
  config.meta = { externalBackend: { projectRef: 'existing-customer-project' }, billingState: 'pending_customer_consent' };
  config.pages = ['/', '/about', '/services', '/academy', '/resources', '/growth-iq', '/journal', '/events', '/contact'].map((slug, index) => ({
    id: String(index), slug, title: slug === '/' ? 'Home' : slug.slice(1), sections: [{ id: 'hero', type: 'hero', content: { title: 'Existing title' } }],
  }));
  config.pages[0].sections = [
    { id: 'hero', type: 'hero', content: { title: 'Existing title', image: 'https://client.example/IcyWilliams.jpg', imageAlt: 'Icy Williams' } },
    { id: 'founder', type: 'hero', content: { title: 'Founder story', image: 'https://client.example/IcyWilliams.jpg', text: 'Existing founder copy' } },
    { id: 'faq', type: 'faq', content: { items: [{ question: 'Existing question', answer: 'Existing answer' }] } },
  ];
  config.pages.at(-1)!.sections.push({ id: 'contact', type: 'contact_form', content: {} });
  return config;
}

describe('Legacy 83 repository design restoration', () => {
  it('keeps nine stable page IDs, customer backend, billing state and existing interactive sections', () => {
    const original = fixture();
    const result = restoreLegacy83Premium(original);
    expect(result.pages.map(page => [page.id, page.slug])).toEqual(original.pages!.map(page => [page.id, page.slug]));
    expect(result.meta.externalBackend).toEqual(original.meta!.externalBackend);
    expect(result.meta.billingState).toEqual('pending_customer_consent');
    expect(result.pages.find(page => page.slug === '/contact')?.sections.find(section => section.type === 'contact_form')).toEqual(original.pages!.at(-1)!.sections.find(section => section.type === 'contact_form'));
    expect(result.pages[0].sections.find(section => section.id === 'faq')).toEqual(original.pages![0].sections[2]);
    expect(result.pages[1].sections.find(section => section.id === 'home-founder-story')?.content.text).toBe('Existing founder copy');
    expect(original.pages![0].sections).toHaveLength(3);
    expect(restoreLegacy83Premium(result)).toEqual(result);
    expect(validateSiteConfig(ensureComposableSiteConfig(result)).errors).toEqual([]);
  });

  it('renders the approved founder portrait, highlighted headline and photographic service pathways', () => {
    const config = ensureComposableSiteConfig(restoreLegacy83Premium(fixture()));
    const { container } = render(<PublicTenantComposableSite site={{ id: 'existing', subdomain: 'legacy83-preview', siteName: 'Legacy 83 Business', organizationId: null, config }} basePath="/sites/legacy83-preview" />);
    expect(screen.getAllByAltText('Icy Williams, founder of Legacy 83 Business')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(container.querySelector('h1 em')?.textContent).toBe('Legacy');
    expect(Array.from(container.querySelectorAll('h1 .tenant-title-line'), element => element.textContent?.trim())).toEqual(['Build Today.', 'Leave a Legacy', 'Tomorrow.']);
    const hero = within(container.querySelector('[data-variant="reference"]') as HTMLElement);
    expect(hero.getByRole('link', { name: 'Book a Consultation →' })).toHaveAttribute('href', '/sites/legacy83-preview/contact');
    expect(hero.getByRole('link', { name: 'Explore Our Services' })).toHaveAttribute('href', '/sites/legacy83-preview/services');
    expect(container.querySelectorAll('[data-variant="photographic"] article')).toHaveLength(4);
    expect(container.querySelectorAll('[data-variant="photographic"] article img')).toHaveLength(4);
    expect(container.querySelectorAll('[data-variant="reference-framework"] article')).toHaveLength(5);
  });

  it('keeps draft navigation inside the editor without persisting or leaving the customer project', () => {
    const config = ensureComposableSiteConfig(restoreLegacy83Premium(fixture()));
    const navigate = vi.fn();
    const { container } = render(<PublicTenantComposableSite site={{ id: 'existing', subdomain: 'legacy83-preview', siteName: 'Legacy 83 Business', organizationId: null, config }} onNavigate={navigate} />);
    const hero = within(container.querySelector('[data-variant="reference"]') as HTMLElement);
    fireEvent.click(hero.getByRole('link', { name: 'Book a Consultation →' }));
    expect(navigate).toHaveBeenCalledWith('/contact');
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
