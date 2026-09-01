import { describe, expect, it } from 'vitest';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import { validateSiteConfig } from '@/lib/tenant/site-validation';

describe('Website Builder publish contract', () => {
  it('migrates a legacy product site into one canonical composable page model', () => {
    const legacy = buildDefaultSiteConfig({ organizationName: 'Meri-Gold-Round' });
    legacy.branding.logoText = 'Meri-Gold-Round';
    legacy.homepage.heroTitle = 'Make wellness part of your everyday round';
    legacy.homepage.heroSubtitle = 'Botanical oils and skin and hair-care essentials.';
    legacy.homepage.heroCtaText = 'Shop the collection';
    legacy.homepage.heroCtaHref = '/shop';
    legacy.homepage.heroImage = '/images/meri-gold-round.webp';
    legacy.homepage.heroImageAlt = 'Meri-Gold-Round botanical wellness collection';
    legacy.products = [{
      name: 'Signature Botanical Oil',
      offerId: 'offer_signature_botanical_oil',
      description: 'A botanical personal-care oil.',
      price: '45.00',
      href: '/shop',
      image: '/images/meri-gold-round.webp',
      imageAlt: 'Meri-Gold-Round signature botanical oil',
    }];
    legacy.footer.description = 'Independent botanical cosmetic and personal-care brand.';
    legacy.footer.contactEmail = 'contact@example.com';
    legacy.contact = { email: 'contact@example.com', phone: '317-555-0100', hours: ['Monday - Friday'] };
    legacy.seo = { title: 'Meri-Gold-Round', description: 'Botanical wellness products.', keywords: ['botanical wellness'] };

    const config = ensureComposableSiteConfig(legacy);
    const result = validateSiteConfig(config);

    expect(config.schemaVersion).toBe(2);
    expect(config.pages?.map((page) => page.slug)).toEqual(['/', '/shop', '/about', '/contact']);
    expect(config.navigation.map((item) => item.href)).toEqual(['/', '/shop', '/about', '/contact']);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('blocks publish when navigation or CTA points to a missing internal page', () => {
    const config = ensureComposableSiteConfig(buildDefaultSiteConfig({ organizationName: 'Regression Test' }));
    if (!config.pages?.[0]) throw new Error('Expected home page');
    config.pages[0].sections.push({
      id: 'broken_cta',
      type: 'cta',
      visible: true,
      content: { title: 'Broken CTA', buttonText: 'Go', buttonHref: '/missing-page' },
      settings: {},
    });

    const result = validateSiteConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((issue) => issue.code === 'broken_internal_link')).toBe(true);
  });

  it('requires a contact form on a generated contact page as a publish warning', () => {
    const config = ensureComposableSiteConfig(buildDefaultSiteConfig({ organizationName: 'Regression Test' }));
    const contact = config.pages?.find((page) => page.slug === '/contact');
    if (!contact) throw new Error('Expected contact page');
    contact.sections = contact.sections.filter((section) => section.type !== 'contact_form');

    const result = validateSiteConfig(config);
    expect(result.warnings.some((issue) => issue.code === 'contact_page_without_form')).toBe(true);
  });
  it('blocks public proof without claim evidence and accepts sourced owner-attested proof', () => {
    const config = ensureComposableSiteConfig(buildDefaultSiteConfig({ organizationName: 'Verified Proof Test' }));
    config.stats = { students: 25 };

    const blocked = validateSiteConfig(config);
    expect(blocked.errors.some((issue) => issue.code === 'unverified_public_claim')).toBe(true);

    config.claims = [{
      key: 'student_count',
      value: 25,
      source: 'Enrollment export 2026-09-01',
      verifiedAt: '2026-09-01T00:00:00.000Z',
      status: 'owner_attested',
    }];
    const accepted = validateSiteConfig(config);
    expect(accepted.errors.some((issue) => issue.code === 'unverified_public_claim')).toBe(false);
  });

});
