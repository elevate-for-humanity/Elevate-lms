import { getRecommendedTemplate } from '@/lib/templates/designs';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';

export type TenantSiteConfigPatch = Omit<Partial<TenantSiteConfig>, 'homepage' | 'branding'> & {
  homepage?: Partial<TenantSiteConfig['homepage']>;
  branding?: Partial<TenantSiteConfig['branding']>;
};

/**
 * Creates a safe blank website configuration.
 *
 * Defaults may provide layout and branding structure, but they must never invent
 * enrollment counts, ratings, completion rates, testimonials, programs, services,
 * pricing, credentials, or other business claims. Those values must come from the
 * organization/user or an approved connected data source before publication.
 */
export function buildDefaultSiteConfig(params: {
  organizationName: string;
  organizationType?: string;
  industry?: string;
  contactEmail?: string;
}): TenantSiteConfig {
  const {
    organizationName,
    organizationType = 'Organization',
    industry = 'General',
  } = params;
  const template = getRecommendedTemplate(industry, organizationType);

  const legacy: TenantSiteConfig = {
    schemaVersion: 2,
    template: {
      id: template.id,
      name: template.name,
      fonts: template.fonts,
      colors: template.colors as unknown as Record<string, string>,
      style: template.style as unknown as Record<string, string>,
    },
    branding: {
      primaryColor: template.colors.primary,
      secondaryColor: template.colors.secondary,
      accentColor: template.colors.accent,
      backgroundColor: template.colors.background,
      textColor: template.colors.text,
      logoText: organizationName,
      tagline: '',
    },
    homepage: {
      heroTitle: organizationName,
      heroSubtitle: '',
      heroCtaText: 'Contact Us',
      heroCtaHref: '/contact',
      features: [],
    },
    programs: [],
    navigation: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
    footer: {
      description: organizationName,
      contactEmail: params.contactEmail,
    },
    seo: {
      title: organizationName,
      description: '',
      keywords: [organizationName],
    },
    meta: {
      organizationName,
      organizationType,
      industry,
      generatedAt: new Date().toISOString(),
      source: 'default-site-config',
      parisInterviewCompleted: false,
      requiresContentReview: true,
    },
  };

  return ensureComposableSiteConfig(legacy);
}

export function mergeSiteConfig(base: TenantSiteConfig, partial: TenantSiteConfigPatch): TenantSiteConfig {
  const merged: TenantSiteConfig = {
    ...base,
    ...partial,
    branding: { ...base.branding, ...partial.branding },
    homepage: { ...base.homepage, ...partial.homepage },
    programs: partial.programs ?? base.programs,
    products: partial.products ?? base.products,
    contact: partial.contact ?? base.contact,
    stats: partial.stats ?? base.stats,
    testimonial: partial.testimonial ?? base.testimonial,
    navigation: partial.navigation ?? base.navigation,
    footer: { ...base.footer, ...partial.footer },
    seo: { ...base.seo, ...partial.seo },
    template: partial.template ?? base.template,
    pages: partial.pages ?? base.pages,
    schemaVersion: partial.schemaVersion ?? base.schemaVersion ?? 2,
    meta: { ...base.meta, ...partial.meta },
  };
  return ensureComposableSiteConfig(merged);
}
