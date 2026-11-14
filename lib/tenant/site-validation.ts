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

function flattenStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => flattenStrings(item, out));
  else if (value && typeof value === 'object') Object.values(value as Record<string, unknown>).forEach((item) => flattenStrings(item, out));
  return out;
}

function looksLikeConsumerWellnessStore(config: TenantSiteConfig): boolean {
  const meta = config.meta && typeof config.meta === 'object' ? config.meta as Record<string, unknown> : {};
  const siteKind = text(meta.siteKind).toLowerCase();
  const corpus = flattenStrings([config.branding, config.seo, config.products, config.pages]).join(' ').toLowerCase();
  return siteKind === 'standalone_store' || /\b(cosmetic|skin care|skincare|hair care|body care|wellness oil|soap|beauty)\b/.test(corpus);
}

function scanWellnessClaims(config: TenantSiteConfig, issues: SiteValidationIssue[]) {
  if (!looksLikeConsumerWellnessStore(config)) return;
  const treatmentVerb = /\b(cure|cures|cured|treat|treats|treated|heal|heals|healed|prevent|prevents|diagnose|diagnoses|eliminate|eliminates)\b/i;
  const condition = /\b(eczema|psoriasis|acne|infection|yeast infection|disease|arthritis|diabetes|cancer|depression|anxiety|inflammation|pain)\b/i;
  for (const page of config.pages || []) {
    for (const section of page.sections) {
      for (const phrase of flattenStrings(section.content)) {
        const compact = phrase.replace(/\s+/g, ' ').trim();
        if (!compact) continue;
        if ((treatmentVerb.test(compact) && condition.test(compact)) || /\bperfect for (?:those with )?(eczema|psoriasis|acne|infection)\b/i.test(compact)) {
          issues.push({
            severity: 'error',
            code: 'unsupported_health_treatment_claim',
            message: 'Consumer wellness/cosmetic content contains a treatment-style medical claim. Remove it or provide a separately reviewed, legally supported regulated-product claim before publishing.',
            page: page.slug,
            sectionId: section.id,
          });
          break;
        }
      }
    }
  }
}

function scanProductDestinations(config: TenantSiteConfig, issues: SiteValidationIssue[]) {
  for (const page of config.pages || []) {
    for (const section of page.sections) {
      if (section.type !== 'products') continue;
      const items = Array.isArray(section.content?.items) ? section.content.items : [];
      items.forEach((raw, index) => {
        if (!raw || typeof raw !== 'object') return;
        const item = raw as Record<string, unknown>;
        const href = text(item.href);
        const offerId = text(item.offerId || item.offer_id);
        const checkoutUrl = text(item.checkoutUrl || item.checkout_url);
        const normalizedHref = href ? normalizePageSlug(href.split('?')[0].split('#')[0]) : '';
        if ((!href && !offerId && !checkoutUrl) || (normalizedHref === page.slug && !offerId && !checkoutUrl)) {
          issues.push({
            severity: 'error',
            code: 'product_without_purchase_destination',
            message: `Product ${index + 1} has no real product or checkout destination; it cannot link back to the same Shop page.`,
            page: page.slug,
            sectionId: section.id,
          });
        }
      });
    }
  }
}

function scanPublishedClaims(config: TenantSiteConfig, issues: SiteValidationIssue[]) {
  const claims = new Map((config.claims || []).map((claim) => [claim.key, claim]));
  const normalizedValue = (value: unknown) => typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLowerCase()
    : JSON.stringify(value);
  const requireEvidence = (key: string, present: boolean, displayedValue?: unknown, page?: TenantSitePage, section?: TenantSiteSection) => {
    if (!present) return;
    const claim = claims.get(key);
    if (!claim || claim.status !== 'verified' || !text(claim.source) || !text(claim.verifiedAt)) {
      issues.push({
        severity: 'error',
        code: 'unverified_public_claim',
        message: `Public claim “${key}” requires a source and verification timestamp before publishing.`,
        page: page?.slug,
        sectionId: section?.id,
      });
    } else if (displayedValue !== undefined && normalizedValue(displayedValue) !== normalizedValue(claim.value)) {
      issues.push({
        severity: 'error',
        code: 'public_claim_value_mismatch',
        message: `Displayed value for “${key}” does not match the verified evidence record.`,
        page: page?.slug,
        sectionId: section?.id,
      });
    }
  };

  requireEvidence('student_count', config.stats?.students !== undefined, config.stats?.students);
  requireEvidence('completion_rate', Boolean(text(config.stats?.completionRate)), config.stats?.completionRate);
  requireEvidence('employer_count', config.stats?.employers !== undefined, config.stats?.employers);
  requireEvidence('rating', Boolean(text(config.stats?.rating)), config.stats?.rating);
  requireEvidence('testimonial', Boolean(config.testimonial?.quote || config.testimonial?.author), config.testimonial?.quote);

  for (const page of config.pages || []) {
    for (const section of page.sections) {
      if (section.type !== 'stats' && section.type !== 'testimonial' && section.type !== 'pricing') continue;
      const sectionKey = text(section.content.claimKey);
      const items = Array.isArray(section.content.items) ? section.content.items : [];
      const sectionValue = section.type === 'testimonial' ? section.content.quote : section.content.value;
      if (sectionKey) requireEvidence(sectionKey, true, sectionValue, page, section);
      else if (items.length === 0) requireEvidence(`${section.type}:${section.id}`, true, sectionValue, page, section);
      for (const [index, item] of items.entries()) {
        const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        const itemKey = text(record.claimKey);
        const displayed = section.type === 'pricing' ? record.price : section.type === 'testimonial' ? record.quote : record.value;
        requireEvidence(itemKey || `${section.type}:${section.id}:${index}`, true, displayed, page, section);
      }
    }
  }
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

  scanWellnessClaims(config, issues);
  scanProductDestinations(config, issues);
  scanPublishedClaims(config, issues);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  return { valid: errors.length === 0, errors, warnings, pageCount: pages.length, sectionCount };
}
