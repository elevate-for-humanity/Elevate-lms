import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { applyWebsiteDesign } from '@/lib/website-builder/design-choices';

// Exercise the subscriber renderer with a new business, not the Legacy 83 template.
afterEach(cleanup);
function subscriber(type: 'rich_text' | 'cta', image = '/owner-approved.jpg') {
  const config = applyWebsiteDesign(buildDefaultSiteConfig({ organizationName: 'Customer Business' }), { template: 'executive' });
  config.pages = [
    { id: 'home', slug: '/', title: 'Home', sections: [
      { id: 'hero', type: 'hero', content: { title: 'Owner headline' } },
      { id: 'story', type, content: { eyebrow: 'Our story', title: 'Owner story', text: 'Verified customer copy', image, imageAlt: 'Owner-approved image', buttonText: 'Talk to us', buttonHref: '/contact' }, settings: { layout: 'split', imagePosition: 'left' } },
    ] },
    { id: 'contact', slug: '/contact', title: 'Contact', sections: [{ id: 'contact-hero', type: 'hero', content: { title: 'Contact' } }] },
  ];
  return { id: 'subscriber-project', subdomain: 'customer-business', siteName: 'Customer Business', organizationId: null, config };
}
describe('shared subscriber compositions', () => {
  it.each(['rich_text', 'cta'] as const)('renders %s as an editable split composition with tenant-scoped CTA', type => {
    const site = subscriber(type);
    const original = structuredClone(site.config);
    const navigate = vi.fn();
    const { container } = render(<PublicTenantComposableSite site={site} basePath="/sites/customer-business" onNavigate={navigate} />);
    const section = container.querySelector('.tenant-editorial-split') as HTMLElement;
    expect(section).toHaveAttribute('data-section-id', 'story');
    expect(section).toHaveAttribute('data-image-position', 'left');
    expect(within(section).getByRole('heading', { name: 'Owner story' })).toBeTruthy();
    expect(within(section).getByRole('img')).toHaveAttribute('src', '/owner-approved.jpg');
    const cta = within(section).getByRole('link', { name: 'Talk to us' });
    expect(cta).toHaveAttribute('href', '/sites/customer-business/contact');
    fireEvent.click(cta);
    expect(navigate).toHaveBeenCalledWith('/contact');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(container.querySelector('.legacy83-premium')).toBeNull();
    expect(site.config).toEqual(original);
  });
  it('uses existing text rendering when the image has not been supplied', () => {
    const { container } = render(<PublicTenantComposableSite site={subscriber('rich_text', '')} />);
    expect(container.querySelector('.tenant-editorial-split')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Owner story' })).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });
  it('includes every subscriber destination in keyboard-operable compact navigation', () => {
    render(<PublicTenantComposableSite site={subscriber('rich_text')} basePath="/sites/customer-business" />);
    const nav = within(screen.getByRole('navigation', { name: 'Mobile navigation', hidden: true }));
    expect(nav.getByRole('link', { name: 'Home', hidden: true })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Contact', hidden: true })).toHaveAttribute('href', '/sites/customer-business/contact');
  });
});
