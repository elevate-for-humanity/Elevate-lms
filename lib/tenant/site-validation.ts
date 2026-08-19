import type { TenantSiteConfig, TenantSitePage, TenantSiteSection } from '@/lib/tenant/site-types';
import { ensureComposableSiteConfig, normalizePageSlug } from '@/lib/tenant/site-composition';

export type SiteValidationIssue = {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  page?: string;
  sectionId?: string;
};

export type SiteValidationResult = {
  valid: boolean;
  errors: SiteValidationIssue[];
  warnings: SiteValidationIssue[];
  pageCount: number;
  sectionCount: number;
};

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isMediaAsset(value: string) {
  const clean = value.split('?')[0].split('#')[0].toLowerCase();
  return /\.(?:avif|gif|jpe?g|png|svg|webp|mp4|m4v|mov|webm|ogg|mp3|wav|pdf)$/i.test(clean)
    || /^\/(?:images|videos|audio|uploads|storage|assets|media)\//i.test(clean)
    || /^data:/i.test(value)
    || /^blob:/i.test(value);
}

function inspectHref(value: unknown, knownPaths: Set<string>, issues: SiteValidationIssue[], page: TenantSitePage, section?: TenantSiteSection) {
  const href = text(value);
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  if (isMediaAsset(href)) return;
  if (/^https?:\/\//i.test(href)) {
    try { new URL(href); } catch {
      issues.push({ severity: 'error', code: 'invalid_external_link', message: `Invalid external link: ${href}`, page: page.slug, sectionId: section?.id });
    }
    return;
  }
  if (!href.startsWith('/')) {
    issues.push({ severity: 'error', code: 'invalid_internal_link', message: `Internal link must begin with “/”: ${href}`, page: page.slug, sectionId: section?.id });
    return;
  }
  const normalized = normalizePageSlug(href.split('?')[0].split('#')[0]);
  if (!knownPaths.has(normalized)) {
    issues.push({ severity: 'error', code: 'broken_internal_link', message: `Internal link points to a page that does not exist: ${href}`, page: page.slug, sectionId: section?.id });
  }
}

function scanObjectForLinks(value: unknown, knownPaths: Set<string>, issues: SiteValidationIssue[], page: TenantSitePage, section: TenantSiteSection) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) scanObjectForLinks(item, knownPaths, issues, page, section);
    return;
  }
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (/href$|url$|link$/i.test(key) && typeof item === 'string') inspectHref(item, knownPaths, issues, page, section);
    else if (item && typeof item === 'object') scanObjectForLinks(item, knownPaths, issues, page, section);
  }
}

function scanImages(value: unknown, issues: SiteValidationIssue[], page: TenantSitePage, section: TenantSiteSection) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) scanImages(item, issues, page, section);
    return;
  }
  const obj = value as Record<string, unknown>;
  if (text(obj.image) && !text(obj.imageAlt) && !text(obj.alt)) {
    issues.push({ severity: 'warning', code: 'missing_image_alt', message: 'Image is missing accessibility alt text.', page: page.slug, sectionId: section.id });
  }
  for (const item of Object.values(obj)) if (item && typeof item === 'object') scanImages(item, issues, page, section);
}

export function validateSiteConfig(input: TenantSiteConfig): SiteValidationResult {
  const config = ensureComposableSiteConfig(input);
  const issues: SiteValidationIssue[] = [];
  const pages = config.pages || [];
  const knownPaths = new Set(pages.map((page) => page.slug));

  if (!pages.length) issues.push({ severity: 'error', code: 'no_pages', message: 'Website has no pages.' });
  if (!knownPaths.has('/')) issues.push({ severity: 'error', code: 'missing_home', message: 'Website requires a home page at “/”.' });
  if (!text(config.branding.logoText)) issues.push({ severity: 'error', code: 'missing_site_identity', message: 'Website name/logo text is required.' });
  if (!text(config.seo?.title)) issues.push({ severity: 'warning', code: 'missing_site_seo_title', message: 'Site SEO title is missing.' });
  if (!text(config.seo?.description)) issues.push({ severity: 'warning', code: 'missing_site_seo_description', message: 'Site SEO description is missing.' });

  const seen = new Set<string>();
  let sectionCount = 0;
  for (const page of pages) {
    if (seen.has(page.slug)) issues.push({ severity: 'error', code: 'duplicate_page_slug', message: `Duplicate page path: ${page.slug}`, page: page.slug });
    seen.add(page.slug);
    if (!text(page.title)) issues.push({ severity: 'error', code: 'missing_page_title', message: 'Page title is required.', page: page.slug });
    if (!page.sections.length) issues.push({ severity: 'warning', code: 'empty_page', message: 'Page has no visible content sections.', page: page.slug });
    if (!text(page.seo?.title)) issues.push({ severity: 'warning', code: 'missing_page_seo_title', message: 'Page SEO title is missing.', page: page.slug });
    if (!text(page.seo?.description)) issues.push({ severity: 'warning', code: 'missing_page_seo_description', message: 'Page SEO description is missing.', page: page.slug });

    if (page.slug === '/contact' && !page.sections.some((section) => section.type === 'contact_form')) {
      issues.push({ severity: 'warning', code: 'contact_page_without_form', message: 'Contact page does not contain a contact form.', page: page.slug });
    }

    for (const section of page.sections) {
      sectionCount += 1;
      if (!section.id) issues.push({ severity: 'error', code: 'missing_section_id', message: 'Section is missing its stable ID.', page: page.slug });
      scanObjectForLinks(section.content, knownPaths, issues, page, section);
      scanImages(section.content, issues, page, section);
      if (section.type === 'hero' && !text(section.content.title)) issues.push({ severity: 'warning', code: 'hero_without_heading', message: 'Hero section has no heading.', page: page.slug, sectionId: section.id });
      if (section.type === 'video' && !text(section.content.url)) issues.push({ severity: 'error', code: 'video_without_url', message: 'Video section has no video URL.', page: page.slug, sectionId: section.id });
      if (section.type === 'booking' && !text(section.content.url) && !text(section.content.bookingUrl)) issues.push({ severity: 'error', code: 'booking_without_url', message: 'Booking section has no booking destination.', page: page.slug, sectionId: section.id });
    }
  }

  for (const nav of config.navigation || []) inspectHref(nav.href, knownPaths, issues, pages.find((page) => page.slug === nav.href) || pages[0] || { id: 'site', slug: '/', title: 'Site', sections: [] });

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  return { valid: errors.length === 0, errors, warnings, pageCount: pages.length, sectionCount };
}
