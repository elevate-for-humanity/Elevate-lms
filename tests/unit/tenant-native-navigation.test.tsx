import type { ComponentProps } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import saved from '../fixtures/legacy83-saved-config.json';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { ResponsivePreviewClient } from '../../apps/marketing/app/apps/website-builder/edit/[websiteId]/preview/ResponsivePreviewClient';

// Model an intercepted client transition that cannot reach its router/server.
vi.mock('next/link', () => ({ default: ({ children, ...props }: ComponentProps<'a'>) => <a {...props} onClick={event => event.preventDefault()}>{children}</a> }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(cleanup);
const config = saved as TenantSiteConfig;

function expectDocumentNavigation(link: HTMLElement) {
  let applicationPreventedNavigation: boolean | undefined;
  const observe = (event: Event) => {
    applicationPreventedNavigation = event.defaultPrevented;
    event.preventDefault(); // Keep the test runner on its document.
  };
  document.addEventListener('click', observe, { once: true });
  fireEvent.click(link);
  expect(applicationPreventedNavigation).toBe(false);
}

it('keeps desktop, mobile and footer page navigation usable when client routing stalls', () => {
  render(<PublicTenantComposableSite site={{ id: 'existing', subdomain: 'legacy83-preview', siteName: 'Legacy 83 Business', organizationId: null, config }} basePath="/sites/legacy83-preview" />);
  for (const name of ['Main navigation', 'Mobile navigation', 'Footer navigation']) {
    for (const link of within(screen.getByRole('navigation', { name })).getAllByRole('link')) {
      expect(link.getAttribute('href')).toMatch(/^\/sites\/legacy83-preview(?:\/|$)/);
      expectDocumentNavigation(link);
    }
  }
});

it('uses real authenticated page URLs in the private review page selector', () => {
  render(<ResponsivePreviewClient websiteId="existing" siteName="Legacy 83 Business" config={config} />);
  for (const page of config.pages!) {
    const link = screen.getByRole('link', { name: page.title, exact: true });
    expect(link).toHaveAttribute('href', `/apps/website-builder/edit/existing/preview?page=${encodeURIComponent(page.slug)}`);
    expectDocumentNavigation(link);
  }
});
