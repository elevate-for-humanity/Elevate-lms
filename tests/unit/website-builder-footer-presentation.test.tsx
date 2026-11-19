import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import { applySiteOperations } from '@/lib/tenant/site-composition';
import { validateSiteConfig } from '@/lib/tenant/site-validation';
import {
  validateFooterPresentationFields,
  suppliedFooterSocialLinks,
  suppliedFooterLogo,
} from '@/lib/tenant/footer-presentation';
import { TenantSiteFooter } from '@/components/tenant/TenantSiteFooter';
import { TenantPreviewProvider } from '@/components/tenant/TenantPreviewContext';
afterEach(cleanup);
const fixture = () => buildDefaultSiteConfig({ organizationName: 'Subscriber studio' });
const profile = { label: 'Our community', url: 'https://social.example.test/studio' };
function footer(config = fixture(), readOnly = false) {
  return render(
    <TenantPreviewProvider websiteId="fixture" readOnly={readOnly}>
      <TenantSiteFooter
        config={config}
        siteName="Subscriber studio"
        navigation={config.pages!}
        basePath="/sites/fixture"
        pathname="/"
      />
    </TenantPreviewProvider>,
  );
}
describe('shared footer presentation', () => {
  it('retains the default text brand and layout even when a header logo exists', () => {
    const config = fixture();
    config.branding.logoImage = '/saved-logo.svg';
    const { container } = footer(config);
    expect(container.querySelector('[data-footer-logo]')).toBeNull();
    expect(container.querySelector('footer')).toHaveAttribute('data-footer-layout', 'stacked');
    expect(screen.queryByRole('list', { name: 'Social profiles' })).toBeNull();
  });
  it('uses the saved logo, approved profiles, same-site page IDs, and five-column opt-in', () => {
    const config = fixture();
    config.branding.logoImage = '/saved-logo.svg';
    config.footer = {
      ...config.footer,
      showLogo: true,
      layout: 'columns',
      socialLinks: [profile],
      linkGroups: [{ label: 'Company', pageIds: [config.pages![0].id] }],
    };
    const { container } = footer(config);
    expect(container.querySelector('[data-footer-logo]')).toHaveAttribute('src', '/saved-logo.svg');
    const social = within(screen.getByRole('list', { name: 'Social profiles' })).getByRole('link', {
      name: profile.label,
    });
    expect(social).toHaveAttribute('href', profile.url);
    expect(social).toHaveAttribute('rel', 'noopener noreferrer');
    expect(social).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('navigation', { name: 'Footer navigation' })).toHaveClass(
      'lg:grid-cols-5',
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/sites/fixture');
    expect(container.querySelector('.legacy83-premium')).toBeNull();
  });
  it('suppresses all external footer actions in saved read-only previews', () => {
    const config = fixture();
    config.footer.socialLinks = [profile];
    const { container } = footer(config, true);
    expect(screen.getByText(profile.label).closest('[aria-disabled]')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(container.querySelector('a[href^="https:"], a[href^="mailto:"]')).toBeNull();
  });
  it('fails closed for unsafe URLs in older stored configs', () => {
    const config = fixture();
    config.branding.logoImage = 'javascript:alert(1)';
    config.footer = {
      ...config.footer,
      showLogo: true,
      socialLinks: [{ label: 'Bad', url: 'javascript:alert(1)' }],
    };
    const { container } = footer(config);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByText('Bad')).toBeNull();
  });
  it.each([
    null,
    [],
    { showLogo: 'true' },
    { showLogo: null },
    { layout: null },
    { layout: 'custom' },
    { socialLinks: null },
    { socialLinks: {} },
    { socialLinks: Array(7).fill(profile) },
    { socialLinks: [{ label: '', url: profile.url }] },
    { socialLinks: [{ label: 'x'.repeat(81), url: profile.url }] },
  ])('rejects malformed raw configuration: %j', (value) => {
    expect(validateFooterPresentationFields({ footer: value }).length).toBeGreaterThan(0);
    expect(validateSiteConfig({ ...fixture(), footer: value } as any).valid).toBe(false);
  });
  it.each([
    'javascript:alert(1)',
    'http://example.test',
    'https:example.test',
    'https:/example.test',
    'https:///example.test',
    '//example.test',
    'https://user:pass@example.test',
    'https://example.test/with space',
    'https://example.test/\\evil',
    'https://example.test/\nheader',
  ])('rejects unsafe profile URL %s', (url) => {
    expect(
      validateFooterPresentationFields({ footer: { socialLinks: [{ label: 'Profile', url }] } }),
    ).toHaveLength(1);
  });
  it('preserves settings through merge, serialization, reopening, and unrelated PARIS page edits', () => {
    const base = fixture();
    const next = mergeSiteConfig(base, {
      footer: { showLogo: true, layout: 'columns', socialLinks: [profile] } as any,
    });
    const reopened = JSON.parse(JSON.stringify(next));
    const edited = applySiteOperations(reopened, [
      { type: 'rename_page', pageId: reopened.pages[0].id, title: 'New home' },
    ]);
    expect(edited.footer).toEqual(next.footer);
    expect(base.footer.socialLinks).toBeUndefined();
    expect(validateSiteConfig(edited).valid).toBe(true);
  });
  it('retains only complete URLs supplied by the owner', () => {
    expect(suppliedFooterSocialLinks([profile], ['Follow ' + profile.url + '.'])).toEqual([
      profile,
    ]);
    expect(suppliedFooterSocialLinks([profile], [profile.url + '-other'])).toEqual([]);
    expect(suppliedFooterSocialLinks([profile], [])).toEqual([]);
  });
});

it('renders optional social icons with the saved accessible labels', () => {
  const config = fixture();
  config.footer.socialLinks = [{ ...profile, icon: 'linkedin' }];
  footer(config);
  const link = screen.getByRole('link', { name: profile.label });
  expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
});
it('rejects arbitrary icon identifiers and non-string icons', () => {
  for (const icon of ['other', null, [], {}])
    expect(
      validateFooterPresentationFields({ footer: { socialLinks: [{ ...profile, icon }] } }),
    ).toHaveLength(1);
});

it.each(['/sites/fixture', '/review?revision=saved&device=mobile&page='])(
  'links an opted-in footer logo Home within its public or saved preview context: %s',
  (basePath) => {
    const config = fixture();
    config.footer.showLogo = true;
    config.branding.logoImage = '/saved-logo.svg';
    render(
      <TenantPreviewProvider websiteId="fixture" readOnly>
        <TenantSiteFooter
          config={config}
          siteName="Subscriber studio"
          navigation={config.pages!}
          basePath={basePath}
          pathname="/about"
        />
      </TenantPreviewProvider>,
    );
    const brand = screen.getByRole('link', { name: 'Subscriber studio' });
    expect(brand).toHaveAttribute(
      'href',
      basePath.includes('?') ? '/review?revision=saved&device=mobile&page=%2F' : '/sites/fixture',
    );
    expect(brand.querySelector('[data-footer-logo]')).toHaveAttribute('src', '/saved-logo.svg');
  },
);

it('retains exact profiles and logos immediately after owner labels without accepting longer-URL prefixes', () => {
  expect(suppliedFooterSocialLinks([profile],['LinkedIn:'+profile.url])).toEqual([profile]);
  expect(suppliedFooterLogo('/uploads/studio.svg',['Logo:/uploads/studio.svg'])).toBe('/uploads/studio.svg');
  expect(suppliedFooterSocialLinks([profile],['LinkedIn:'+profile.url+'-other'])).toEqual([]);
  expect(suppliedFooterLogo('/uploads/studio.svg',['Logo:/uploads/studio.svg.other'])).toBeUndefined();
});

it('retains the exact spelling of supplied uppercase HTTPS profile and logo sources without prefix matching',()=>{
 const upper={...profile,url:'HTTPS://social.example.test/studio'};
 expect(suppliedFooterSocialLinks([upper],['LinkedIn:'+upper.url])).toEqual([upper]);
 expect(suppliedFooterLogo('HTTPS://images.example.test/logo.svg',['Logo:HTTPS://images.example.test/logo.svg'])).toBe('HTTPS://images.example.test/logo.svg');
 expect(suppliedFooterSocialLinks([upper],['LinkedIn:'+upper.url+'-other'])).toEqual([]);
});
