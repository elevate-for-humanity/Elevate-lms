import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import saved from '../fixtures/legacy83-saved-config.json';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { ResponsivePreviewClient } from '../../apps/marketing/app/apps/website-builder/edit/[websiteId]/preview/ResponsivePreviewClient';
import { tenantSiteHref } from '@/lib/tenant/site-links';
afterEach(cleanup);
const revision = '11111111-1111-4111-8111-111111111111';
describe('saved-version review navigation', () => {
 it('retains the selected version across pages and screen sizes and disables submission controls', async () => {
  render(<ResponsivePreviewClient websiteId="site-a" siteName="Legacy 83" config={saved as TenantSiteConfig} pageSlug="/contact" revisionId={revision} />);
  expect(screen.getByText(/Forms, checkout and PARIS are disabled/)).toBeTruthy();
  expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', `/apps/website-builder/edit/site-a/preview?page=%2Fabout&revision=${revision}`);
  fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));
  expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', `/apps/website-builder/edit/site-a/preview?page=%2Fabout&device=mobile&revision=${revision}`);
  const frame = screen.getByTitle('Legacy 83 mobile preview') as HTMLIFrameElement;
  await waitFor(() => expect(within(frame.contentDocument!.body).getByRole('heading', { level: 1 })).toBeTruthy());
  expect(frame.style.width).toBe('390px');
  expect(frame.contentDocument!.querySelector('fieldset')).toBeDisabled();
  expect(within(frame.contentDocument!.body).queryByRole('button', { name: 'Need help? Ask PARIS' })).toBeNull();
 });
 it('keeps copied internal links inside the chosen saved version', () => {
  const base = `/apps/website-builder/edit/site-a/preview?revision=${revision}&page=`;
  expect(tenantSiteHref('/about', base)).toBe(`${base}%2Fabout`);
  expect(tenantSiteHref('/contact?topic=strategy#form', base)).toBe(`${base}%2Fcontact&topic=strategy#form`);
  expect(tenantSiteHref('https://customer.example', base)).toBe('https://customer.example');
 });
});
