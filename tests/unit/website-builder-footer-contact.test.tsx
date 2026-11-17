import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TenantFooterContact } from '@/components/tenant/TenantFooterContact';
import { TenantPreviewProvider } from '@/components/tenant/TenantPreviewContext';
import { footerContactDetails, validateFooterContactFields } from '@/lib/tenant/footer-contact';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

const config = (enabled?: unknown, contact?: unknown) => ({ footer: { showContactDetails: enabled }, contact } as unknown as TenantSiteConfig);
describe('optional saved footer contact column', () => {
  it.each([undefined, false, 'true', 1, null])('stays off unless explicitly true: %s', enabled => {
    expect(footerContactDetails(config(enabled, { phone: '5551234567' }))).toBeNull();
  });
  it('does not invent an empty contact column', () => {
    expect(renderToStaticMarkup(<TenantFooterContact config={config(true)} />)).toBe('');
  });
  it('renders saved details and functional direct contact links', () => {
    const saved = config(true, { email: 'owner@example.test', phone: '+1 (555) 123-4567', address: 'Owner supplied address\nSuite 7', hours: ['Monday 9–5', 'By appointment'] });
    const html = renderToStaticMarkup(<TenantFooterContact config={saved} />);
    for (const value of ['mailto:owner@example.test', 'tel:+15551234567', 'Suite 7', 'Monday 9–5', 'Business hours']) expect(html).toContain(value);
    expect(saved.contact?.address).toContain('\n');
  });
  it('suppresses contact actions in read-only saved previews', () => {
    const html = renderToStaticMarkup(<TenantPreviewProvider websiteId="fixture" readOnly><TenantFooterContact config={config(true, { email: 'owner@example.test', phone: '5551234567' })} /></TenantPreviewProvider>);
    expect(html).toContain('owner@example.test'); expect(html).not.toContain('href=');
  });
  it('never constructs action URLs from unsafe contact values', () => {
    const details = footerContactDetails(config(true, { email: 'x@example.test?subject=injected', phone: 'javascript:alert(1)' }));
    expect(details?.emailHref).toBeNull(); expect(details?.phoneHref).toBeNull();
  });
  it.each([null, 'true', 1, [], {}])('rejects malformed raw opt-in before transformations: %s', value => {
    expect(validateFooterContactFields(config(value))).toHaveLength(1);
  });
  it.each([undefined, true, false])('accepts only optional boolean configuration: %s', value => {
    expect(validateFooterContactFields(config(value))).toEqual([]);
  });
});
