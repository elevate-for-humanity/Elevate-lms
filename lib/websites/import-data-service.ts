import { parse } from 'csv-parse/sync';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';
import type { TenantSiteConfigPatch } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

const MAX_IMPORT_BYTES = 2_000_000;
const MAX_ROWS = 500;

type ImportFormat = 'json' | 'csv';

export type StructuredWebsiteImport = {
  format: ImportFormat;
  siteName: string;
  recordCount: number;
  config: TenantSiteConfig;
};

function clean(value: unknown, max = 1600): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeHttpUrl(value: unknown): string | undefined {
  const text = clean(value);
  if (!text) return undefined;
  try {
    const parsed = new URL(text);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : undefined;
  } catch {
    return text.startsWith('/') ? text : undefined;
  }
}

function asObject(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : null;
}

function importedConfigObject(value: unknown): Record<string, any> {
  const root = asObject(value);
  if (!root) throw new Error('JSON import must contain a website configuration object');
  return asObject(root.siteConfig) || asObject(root.config) || root;
}

function csvPatch(rows: Array<Record<string, unknown>>) {
  const patch: TenantSiteConfigPatch = {
    homepage: { features: [] },
    programs: [],
    products: [],
    navigation: [],
    contact: {},
    meta: { importedFrom: 'file', importedFormat: 'csv' },
  };
  let siteName = '';

  for (const row of rows.slice(0, MAX_ROWS)) {
    const type = clean(row.type || row.record_type || row.kind, 40).toLowerCase();
    const name = clean(row.name || row.title, 180);
    const description = clean(row.description || row.content, 1800);
    const href = safeHttpUrl(row.href || row.url || row.link);
    const image = safeHttpUrl(row.image || row.image_url);

    if (type === 'site' || type === 'business' || type === 'organization') {
      siteName = name || siteName;
      if (name) patch.branding = { ...(patch.branding || {}), logoText: name };
      if (description) patch.homepage = { ...(patch.homepage || {}), heroSubtitle: description };
    } else if (type === 'program' || type === 'service' || type === 'course') {
      if (name) patch.programs?.push({ name, description, ...(image ? { image } : {}) });
    } else if (type === 'product') {
      if (name) patch.products?.push({
        name,
        description,
        price: clean(row.price, 40) || undefined,
        compareAtPrice: clean(row.compare_at_price, 40) || undefined,
        ...(href ? { href } : {}),
        ...(image ? { image } : {}),
        category: clean(row.category, 120) || undefined,
      });
    } else if (type === 'feature') {
      if (name) patch.homepage!.features!.push({ title: name, description, ...(image ? { image } : {}) });
    } else if (type === 'navigation' || type === 'nav') {
      if (name && href) patch.navigation?.push({ label: name, href });
    } else if (type === 'contact') {
      patch.contact = {
        ...patch.contact,
        email: clean(row.email, 180) || patch.contact?.email,
        phone: clean(row.phone, 80) || patch.contact?.phone,
        address: clean(row.address, 300) || patch.contact?.address,
        bookingUrl: safeHttpUrl(row.booking_url) || patch.contact?.bookingUrl,
      };
    }
  }

  return { patch, siteName };
}

export function importStructuredWebsiteData(params: {
  content: string;
  fileName?: string;
  contactEmail?: string;
}): StructuredWebsiteImport {
  const content = params.content.trim();
  if (!content) throw new Error('Import file is empty');
  if (Buffer.byteLength(content, 'utf8') > MAX_IMPORT_BYTES) {
    throw new Error('Import file must be 2 MB or smaller');
  }

  const format: ImportFormat = params.fileName?.toLowerCase().endsWith('.csv') ? 'csv' : 'json';
  let source: Record<string, any>;
  let recordCount = 1;
  let csvSiteName = '';

  if (format === 'csv') {
    const rows = parse(content, {
      columns: (headers: string[]) => headers.map((header) => header.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    }) as Array<Record<string, unknown>>;
    if (rows.length > MAX_ROWS) throw new Error(`CSV import supports up to ${MAX_ROWS} rows`);
    const converted = csvPatch(rows);
    source = converted.patch as Record<string, any>;
    csvSiteName = converted.siteName;
    recordCount = rows.length;
  } else {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('JSON import is not valid JSON');
    }
    source = importedConfigObject(parsed);
    recordCount = Array.isArray((parsed as any)?.records) ? (parsed as any).records.length : 1;
  }

  const siteName = clean(
    csvSiteName || source.siteName || source.site_name || source.branding?.logoText || source.meta?.organizationName,
    120,
  ) || 'Imported Website';
  const base = buildDefaultSiteConfig({ organizationName: siteName, contactEmail: params.contactEmail });
  let config = mergeSiteConfig(base, {
    ...(source as TenantSiteConfigPatch),
    meta: {
      ...(base.meta || {}),
      ...(asObject(source.meta) || {}),
      importedFrom: 'file',
      importedFormat: format,
      importedAt: new Date().toISOString(),
      parisInterviewCompleted: true,
      requiresContentReview: true,
    },
  });

  const requestedNavigation = Array.isArray(source.navigation) ? source.navigation : [];
  if (requestedNavigation.length && config.pages) {
    const pages = [...config.pages];
    for (const item of requestedNavigation.slice(0, 16)) {
      const label = clean(item?.label || item?.name, 100);
      const href = safeHttpUrl(item?.href || item?.url);
      if (!label || !href?.startsWith('/')) continue;
      const existingPage = pages.find((page) => page.slug === href);
      if (existingPage) {
        existingPage.navLabel = label;
        continue;
      }
      pages.push({
        id: `page_import_${pages.length + 1}`,
        slug: href,
        title: label,
        navLabel: label,
        showInNavigation: true,
        sections: [],
      });
    }
    config = ensureComposableSiteConfig({ ...config, pages });
  }

  return { format, siteName, recordCount, config };
}
