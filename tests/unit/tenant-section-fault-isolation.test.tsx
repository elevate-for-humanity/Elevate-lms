import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import savedConfig from '../fixtures/legacy83-saved-config.json';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

// Simulate a production widget that throws while rendering a tenant page.
vi.mock('@/components/tenant/TenantInteractiveSections', () => ({
  TenantAssessment: () => { throw new Error('private widget failure'); },
  TenantEvents: () => null,
  TenantJournal: () => null,
}));

import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('contains an interactive section failure without taking down the tenant site', () => {
  const report = vi.spyOn(console, 'error').mockImplementation(() => {});
  const config = structuredClone(savedConfig) as TenantSiteConfig;
  const page = config.pages!.find((item) => item.slug === '/')!;
  page.sections.splice(1, 0,
    { id: 'broken-assessment', type: 'assessment', visible: true, content: {}, settings: {} },
    { id: 'healthy-content', type: 'rich_text', visible: true, content: { title: 'Healthy sibling section', text: 'Still available.' }, settings: {} },
  );

  render(<PublicTenantComposableSite site={{
    id: 'tenant-one',
    subdomain: 'legacy83-preview',
    siteName: 'Legacy 83 Business',
    organizationId: null,
    config,
  }} basePath="/sites/legacy83-preview" />);

  expect(screen.getByRole('status')).toHaveTextContent('This section is temporarily unavailable.');
  expect(screen.queryByText('private widget failure')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Healthy sibling section' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Footer navigation' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Contact', exact: true })).toHaveAttribute('href', '/sites/legacy83-preview/contact');
  expect(report).toHaveBeenCalled();
});
