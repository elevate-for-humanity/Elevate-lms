import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ZeroCodeStructureEditor } from '@/components/website-builder/ZeroCodeStructureEditor';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
vi.mock('@/components/website-builder/WebsiteDesignPanel', () => ({ WebsiteDesignPanel: () => null }));
vi.mock('@/components/website-builder/SectionImagePicker', () => ({ SectionImagePicker: () => null }));
vi.mock('@/components/website-builder/WebsiteLinkGroupsEditor', () => ({ WebsiteLinkGroupsEditor: () => null }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('saves, reopens and disables the optional contact column without changing saved contact values or page groups', async () => {
  let saved = { template: { id: 'generic' }, branding: {}, homepage: {}, programs: [], navigation: [], footer: { description: 'Owner copy', linkGroups: [{ label: 'Company', pageIds: ['home'] }] }, contact: { phone: '5551234567', address: 'Saved business address' }, pages: [{ id: 'home', slug: '/', title: 'Home', sections: [] }] } as unknown as TenantSiteConfig;
  const contact = structuredClone(saved.contact);
  const groups = structuredClone(saved.footer.linkGroups);
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    expect(url).toBe('/api/apps/website-builder/sites/fixture');
    expect(options.method).toBe('PATCH');
    saved = JSON.parse(options.body).siteConfig;
    return { ok: true, json: async () => ({ website: { site_config: saved } }) };
  }));
  const label = 'Show saved business contact details in footer';
  const first = render(<ZeroCodeStructureEditor websiteId="fixture" initialConfig={saved} />);
  fireEvent.click(screen.getByLabelText(label));
  await waitFor(() => expect(saved.footer.showContactDetails).toBe(true));
  first.unmount();
  render(<ZeroCodeStructureEditor websiteId="fixture" initialConfig={saved} />);
  expect((screen.getByLabelText(label) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByLabelText(label));
  await waitFor(() => expect(saved.footer.showContactDetails).toBe(false));
  expect(saved.contact).toEqual(contact); expect(saved.footer.linkGroups).toEqual(groups);
});
