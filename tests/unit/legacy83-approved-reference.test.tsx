import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import saved from '../fixtures/legacy83-saved-config.json';
import { restoreLegacy83ApprovedReference } from '../../scripts/restore-legacy83-approved-reference.mjs';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';

afterEach(cleanup);
describe('approved October 16 Legacy 83 reference', () => {
  it('preserves all page and section identities, private integrations and course publication state', () => {
    const original = { ...saved, meta: { externalBackend: { projectRef: 'customer-project' }, billingState: 'disabled' } };
    const next = restoreLegacy83ApprovedReference(original);
    expect(next.pages.map(page => [page.id, page.slug, page.sections.map(section => section.id)])).toEqual(original.pages.map(page => [page.id, page.slug, page.sections.map(section => section.id)]));
    expect(next.meta.externalBackend).toEqual(original.meta.externalBackend);
    expect(next.meta.billingState).toBe('disabled');
    for (const slug of ['/contact', '/growth-iq', '/events']) expect(next.pages.find(page => page.slug === slug)?.sections.filter(section => ['contact_form', 'assessment', 'events'].includes(section.type))).toEqual(original.pages.find(page => page.slug === slug)?.sections.filter(section => ['contact_form', 'assessment', 'events'].includes(section.type)));
    expect(restoreLegacy83ApprovedReference(next)).toEqual(next);
    expect(original).toEqual({ ...saved, meta: { externalBackend: { projectRef: 'customer-project' }, billingState: 'disabled' } });
  });
  it('renders the approved full-width composition, original photograph, three purpose indicators, and four photographic cards', () => {
    const config = ensureComposableSiteConfig(restoreLegacy83ApprovedReference(saved));
    const { container } = render(<PublicTenantComposableSite site={{ id: 'existing', subdomain: 'legacy83-preview', siteName: 'Legacy 83 Business', organizationId: null, config }} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Build Today. Leave a Legacy Tomorrow.');
    expect(container.querySelector('.tenant-hero')).toHaveAttribute('data-variant', 'reference');
    expect(screen.getByAltText('Icy Williams, founder of Legacy 83 Business')).toHaveAttribute('src', '/images/legacy83/icy-williams-original.webp');
    expect(screen.getByAltText('Legacy 83 Business logo')).toHaveAttribute('src', '/images/legacy83/original-logo.webp');
    expect(container.querySelectorAll('.tenant-hero-highlights svg')).toHaveLength(3);
    expect(container.querySelectorAll('[data-variant=photographic] .tenant-card-image-strip')).toHaveLength(4);
    expect(screen.queryByText(/300\+|95%|\$50M/)).toBeNull();
  });
});
