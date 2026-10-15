import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
import ContactPage from '@/apps/marketing/app/contact/page';
import { siteConfig } from '@/lib/config/site';
import { SiteFooter } from '@/components/site-footer';

describe('public phone contacts', () => {
  it('labels both numbers in the footer actually used by the marketing layout', () => {
    const footer = renderToStaticMarkup(<SiteFooter />);
    expect(footer).toContain('Main Phone: (463) 240-1404');
    expect(footer).toContain('Technical Support: (463) 240-1404');
    expect(footer).toContain('href="tel:+14632401404"');
    expect(footer).toContain('href="tel:+14632401404"');
  });
  it('uses the new business number for public contact links', async () => {
    const markup = renderToStaticMarkup(await ContactPage({}));
    expect(markup).toContain('Main Phone — Programs and Admissions');
    expect(markup).toContain('href="tel:+14632401404"');
    expect(markup).toContain('(463) 240-1404');
    expect(markup).toContain('Technical Support — Login and Website Help');
    expect(markup).toContain('href="tel:+14632401404"');
    expect(markup).toContain('(463) 240-1404');
    expect(markup).not.toContain('3140199');
    expect(siteConfig.phone.e164).toBe('+14632401404');
    expect(markup).not.toContain('3177607908');
  });
});
