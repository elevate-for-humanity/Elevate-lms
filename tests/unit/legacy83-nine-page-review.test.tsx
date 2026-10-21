import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import saved from '../fixtures/legacy83-saved-config.json';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { tenantSiteHref } from '@/lib/tenant/site-links';
import { ResponsivePreviewClient } from '../../apps/marketing/app/apps/website-builder/edit/[websiteId]/preview/ResponsivePreviewClient';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const config = saved as TenantSiteConfig;
const site = { id: 'existing', subdomain: 'legacy83-preview', siteName: 'Legacy 83 Business', organizationId: null, config };
const expected = [
  ['/', 'Build Today. Leave a Legacy Tomorrow.'],
  ['/about', 'Build something that outlasts you.'],
  ['/services', 'Your business. Your vision. A stronger future.'],
  ['/resources', 'Tools to Build Your Legacy'],
  ['/academy', 'Legacy 83 Academy'],
  ['/growth-iq', 'Find the Next Area Your Business Needs to Strengthen'],
  ['/journal', 'Practical Insight for Building a Business That Lasts'],
  ['/events', 'Learn, Connect, and Grow Together'],
  ['/contact', "Let's Build Your Legacy Together."],
];

describe('nine saved Legacy 83 pages', () => {
  it.each(expected)('%s renders its own saved heading and all footer destinations', (pathname, heading) => {
    render(<PublicTenantComposableSite site={site} pathname={pathname} basePath="/sites/legacy83-preview" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heading);
    if (pathname !== '/') expect(screen.queryByRole('heading', { name: /Build Today/ })).toBeNull();
    const footer = within(screen.getByRole('navigation', { name: 'Footer navigation' }));
    expect(footer.getAllByRole('link')).toHaveLength(9);
    for (const [slug] of expected) expect(footer.getAllByRole('link').some(link => link.getAttribute('href') === `/sites/legacy83-preview${slug === '/' ? '' : slug}`)).toBe(true);
  });
  it('never silently renders the homepage for an unknown path', () => {
    render(<PublicTenantComposableSite site={site} pathname="/unknown-review-page" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
    expect(screen.queryByText(/Build Today/)).toBeNull();
  });
  it.each([[0, '33%', 'Build the foundation'], [1, '67%', 'Strengthen the systems'], [2, '100%', 'Prepare for sustainable legacy']])('scores the five saved questions for option %s', (choice, score, result) => {
    render(<PublicTenantComposableSite site={site} pathname="/growth-iq" basePath="/sites/legacy83-preview" />);
    const button = screen.getByRole('button', { name: 'See my results' });
    expect(button).toBeDisabled();
    const questions = screen.getAllByRole('group', { name: /^[1-5]\. / });
    expect(questions).toHaveLength(5);
    questions.forEach(question => fireEvent.click(within(question).getAllByRole('radio')[Number(choice)]));
    fireEvent.click(button);
    expect(screen.getByText(`Your result · ${score}`)).toBeTruthy();
    expect(screen.getByRole('heading', { name: String(result) })).toBeTruthy();
  });
  it('keeps private draft links inside the authenticated preview at the selected viewport width', async () => {
    render(<ResponsivePreviewClient websiteId="existing" siteName="Legacy 83 Business" config={config} pageSlug="/about" />);
    const frame = screen.getByTitle('Legacy 83 Business desktop preview') as HTMLIFrameElement;
    expect(frame.style.width).toBe('1280px');
    await waitFor(() => expect(within(frame.contentDocument!.body).getByRole('heading', { level: 1 })).toHaveTextContent('Build something that outlasts you.'));
    const services = within(within(frame.contentDocument!.body).getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Services' });
    expect(services).toHaveAttribute('href', '/apps/website-builder/edit/existing/preview?page=%2Fservices');
    fireEvent.click(services);
    expect(push).toHaveBeenCalledWith('/apps/website-builder/edit/existing/preview?page=%2Fservices', { scroll: false });
    fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));
    expect(frame.style.width).toBe('390px');
    expect(screen.getByRole('link', { name: 'About', current: 'page' })).toHaveAttribute('href', '/apps/website-builder/edit/existing/preview?page=%2Fabout');
  });
  it('preserves private destinations for copied links, anchors and query strings', () => {
    const base = '/apps/website-builder/edit/existing/preview?page=';
    expect(tenantSiteHref('/contact?topic=strategy#message', base)).toBe(base + '%2Fcontact&topic=strategy#message');
    expect(tenantSiteHref('/', base)).toBe(base + '%2F');
    expect(tenantSiteHref(base + '%2Fcontact', base)).toBe(base + '%2Fcontact');
    expect(tenantSiteHref('https://booking.example.com', base)).toBe('https://booking.example.com');
  });
});
