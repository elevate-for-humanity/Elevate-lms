import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
import ContactPage from '@/apps/marketing/app/contact/page';
import { siteConfig } from '@/lib/config/site';
import { SiteFooter } from '@/components/site-footer';

describe('public phone contacts', () => {
  it('labels both numbers in the footer actually used by the marketing layout', () => {
    const footer = renderToStaticMarkup(<SiteFooter />);
    expect(footer).toContain('Main Phone: (317) 999-9620');
    expect(footer).toContain('Technical Support: (317) 314-3757');
    expect(footer).toContain('href="tel:+13179999620"');
    expect(footer).toContain('href="tel:+13173143757"');
  });
  it('keeps the main line and technical support distinct and clickable', async () => {
    const markup = renderToStaticMarkup(await ContactPage({}));
    expect(markup).toContain('Main Phone — Programs and Admissions');
    expect(markup).toContain('href="tel:+13179999620"');
    expect(markup).toContain('(317) 999-9620');
    expect(markup).toContain('Technical Support — Login and Website Help');
    expect(markup).toContain('href="tel:+13173143757"');
    expect(markup).toContain('(317) 314-3757');
    expect(markup).not.toContain('3140199');
    expect(siteConfig.phone.e164).not.toBe(siteConfig.technicalSupport.e164);
  });
});
