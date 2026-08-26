import type {
  TenantSiteConfig,
  TenantSitePage,
  TenantSiteSection,
  TenantSiteSectionType,
} from '@/lib/tenant/site-types';

const SECTION_TYPES: TenantSiteSectionType[] = [
  'hero',
  'rich_text',
  'features',
  'services',
  'products',
  'testimonial',
  'stats',
  'gallery',
  'image',
  'video',
  'faq',
  'team',
  'pricing',
  'cta',
  'contact_form',
  'booking',
];

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizePageSlug(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!raw || raw === '/' || raw === 'home') return '/';
  const cleaned = raw
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/-+/g, '-');
  return cleaned ? `/${cleaned}` : '/';
}

function safeText(value: unknown, max = 3000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeStringArray(value: unknown, max = 24) {
  return Array.isArray(value)
    ? value.map((item) => safeText(item, 500)).filter(Boolean).slice(0, max)
    : [];
}

function safeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function sanitizeSection(value: unknown, index = 0): TenantSiteSection | null {
  const raw = safeObject(value);
  const requestedType = safeText(raw.type, 40) as TenantSiteSectionType;
  const type: TenantSiteSectionType = SECTION_TYPES.includes(requestedType) ? requestedType : 'rich_text';
  const content = safeObject(raw.content);
  const settings = safeObject(raw.settings);
  const sanitizedContent: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(content).slice(0, 60)) {
    if (typeof item === 'string') sanitizedContent[key] = item.slice(0, 8000);
    else if (typeof item === 'number' || typeof item === 'boolean' || item === null) sanitizedContent[key] = item;
    else if (Array.isArray(item)) {
      sanitizedContent[key] = item.slice(0, 40).map((entry) => {
        if (typeof entry === 'string') return entry.slice(0, 2000);
        if (entry && typeof entry === 'object') {
          const out: Record<string, unknown> = {};
          for (const [entryKey, entryValue] of Object.entries(entry as Record<string, unknown>).slice(0, 24)) {
            if (typeof entryValue === 'string') out[entryKey] = entryValue.slice(0, 3000);
            else if (typeof entryValue === 'number' || typeof entryValue === 'boolean' || entryValue === null) out[entryKey] = entryValue;
            else if (Array.isArray(entryValue)) out[entryKey] = safeStringArray(entryValue, 20);
          }
          return out;
        }
        return null;
      }).filter((entry) => entry !== null);
    }
  }

  const sanitizedSettings: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(settings).slice(0, 30)) {
    if (typeof item === 'string') sanitizedSettings[key] = item.slice(0, 500);
    else if (typeof item === 'number' || typeof item === 'boolean' || item === null) sanitizedSettings[key] = item;
  }

  return {
    id: safeText(raw.id, 120) || id(`section${index + 1}`),
    type,
    visible: raw.visible !== false,
    content: sanitizedContent,
    settings: sanitizedSettings,
  };
}

export function sanitizePages(value: unknown): TenantSitePage[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const pages: TenantSitePage[] = [];

  for (const [index, item] of value.slice(0, 24).entries()) {
    const raw = safeObject(item);
    let slug = normalizePageSlug(raw.slug);
    if (seen.has(slug)) slug = normalizePageSlug(`${slug === '/' ? 'page' : slug}-${index + 1}`);
    seen.add(slug);
    const title = safeText(raw.title, 180) || (slug === '/' ? 'Home' : slug.split('/').pop()?.replace(/-/g, ' ') || 'Page');
    const sections = Array.isArray(raw.sections)
      ? raw.sections.map((section, sectionIndex) => sanitizeSection(section, sectionIndex)).filter(Boolean) as TenantSiteSection[]
      : [];

    pages.push({
      id: safeText(raw.id, 120) || id(`page${index + 1}`),
      slug,
      title,
      navLabel: safeText(raw.navLabel, 100) || title,
      showInNavigation: raw.showInNavigation !== false,
      seo: {
        title: safeText(safeObject(raw.seo).title, 180) || title,
        description: safeText(safeObject(raw.seo).description, 500),
        keywords: safeStringArray(safeObject(raw.seo).keywords, 20),
      },
      sections,
    });
  }

  if (!pages.some((page) => page.slug === '/')) {
    pages.unshift({ id: id('home'), slug: '/', title: 'Home', navLabel: 'Home', showInNavigation: true, sections: [] });
  }
  return pages;
}

export function legacyPages(config: TenantSiteConfig): TenantSitePage[] {
  const catalogHref = config.products?.length ? '/shop' : '/programs';
  const home: TenantSitePage = {
    id: 'page_home',
    slug: '/',
    title: 'Home',
    navLabel: 'Home',
    showInNavigation: true,
    seo: config.seo,
    sections: [
      {
        id: 'home_hero',
        type: 'hero',
        visible: true,
        content: {
          eyebrow: config.branding.tagline || '',
          title: config.homepage.heroTitle,
          text: config.homepage.heroSubtitle,
          buttonText: config.homepage.heroCtaText,
          buttonHref: config.homepage.heroCtaHref || catalogHref,
          image: config.homepage.heroImage || '',
          imageAlt: config.homepage.heroImageAlt || '',
        },
        settings: {},
      },
      {
        id: 'home_features',
        type: 'features',
        visible: true,
        content: { items: config.homepage.features || [] },
        settings: {},
      },
    ],
  };

  const catalog: TenantSitePage = {
    id: 'page_catalog',
    slug: catalogHref,
    title: config.products?.length ? 'Shop' : 'Programs',
    navLabel: config.products?.length ? 'Shop' : 'Programs',
    showInNavigation: true,
    sections: [{
      id: 'catalog_items',
      type: config.products?.length ? 'products' : 'services',
      visible: true,
      content: { title: config.products?.length ? 'Shop products' : 'Programs and services', items: config.products?.length ? config.products : config.programs },
      settings: {},
    }],
  };

  const about: TenantSitePage = {
    id: 'page_about',
    slug: '/about',
    title: 'About',
    navLabel: 'About',
    showInNavigation: true,
    sections: [
      { id: 'about_story', type: 'rich_text', visible: true, content: { title: `About ${config.branding.logoText}`, text: config.footer.description }, settings: {} },
      ...(config.stats ? [{ id: 'about_stats', type: 'stats' as const, visible: true, content: { items: config.stats }, settings: {} }] : []),
      ...(config.testimonial ? [{ id: 'about_testimonial', type: 'testimonial' as const, visible: true, content: config.testimonial as unknown as Record<string, unknown>, settings: {} }] : []),
    ],
  };

  const contact: TenantSitePage = {
    id: 'page_contact',
    slug: '/contact',
    title: 'Contact',
    navLabel: 'Contact',
    showInNavigation: true,
    sections: [
      { id: 'contact_details', type: 'rich_text', visible: true, content: { title: 'Contact us', text: config.contact?.address || '', email: config.contact?.email || config.footer.contactEmail || '', phone: config.contact?.phone || '', hours: config.contact?.hours || [] }, settings: {} },
      { id: 'contact_form', type: 'contact_form', visible: true, content: { title: 'Send a message' }, settings: {} },
    ],
  };

  return [home, catalog, about, contact];
}

export function ensureComposableSiteConfig(config: TenantSiteConfig): TenantSiteConfig {
  const desiredCatalogHref = config.products?.length ? '/shop' : '/programs';
  const sourcePages = config.pages?.length ? structuredClone(config.pages) : legacyPages(config);
  const generatedCatalog = sourcePages.find((page) => page.id === 'page_catalog');
  if (generatedCatalog && generatedCatalog.slug !== desiredCatalogHref) {
    const replacement = legacyPages(config).find((page) => page.id === 'page_catalog');
    if (replacement) Object.assign(generatedCatalog, replacement);
  }
  const pages = sanitizePages(sourcePages);
  const navigation = pages
    .filter((page) => page.showInNavigation !== false)
    .map((page) => ({ label: page.navLabel || page.title, href: page.slug }));
  return { ...config, schemaVersion: 2, pages, navigation };
}

export type ParisSiteOperation = {
  type: string;
  page?: string;
  pageId?: string;
  sectionId?: string;
  section?: TenantSiteSection;
  index?: number;
  value?: unknown;
  title?: string;
  slug?: string;
  navLabel?: string;
};

export function applySiteOperations(config: TenantSiteConfig, operations: ParisSiteOperation[]): TenantSiteConfig {
  const next = ensureComposableSiteConfig(config);
  let pages = next.pages ? structuredClone(next.pages) : [];
  let branding = { ...next.branding };
  let seo = { ...next.seo };

  const findPageIndex = (op: ParisSiteOperation) => pages.findIndex((page) =>
    (op.pageId && page.id === op.pageId) ||
    (op.page && (page.slug === normalizePageSlug(op.page) || page.title.toLowerCase() === op.page.toLowerCase())),
  );

  for (const op of operations.slice(0, 40)) {
    switch (op.type) {
      case 'create_page': {
        const slug = normalizePageSlug(op.slug || op.title || 'page');
        if (pages.some((page) => page.slug === slug)) break;
        pages.push({
          id: id('page'), slug, title: safeText(op.title, 180) || 'New Page', navLabel: safeText(op.navLabel, 100) || safeText(op.title, 180) || 'New Page', showInNavigation: true, sections: [],
        });
        break;
      }
      case 'delete_page': {
        const index = findPageIndex(op);
        if (index >= 0 && pages[index].slug !== '/') pages.splice(index, 1);
        break;
      }
      case 'rename_page': {
        const index = findPageIndex(op);
        if (index >= 0) {
          if (op.title) pages[index].title = safeText(op.title, 180);
          if (op.navLabel) pages[index].navLabel = safeText(op.navLabel, 100);
          if (op.slug && pages[index].slug !== '/') pages[index].slug = normalizePageSlug(op.slug);
        }
        break;
      }
      case 'add_section': {
        const index = findPageIndex(op);
        const section = sanitizeSection(op.section, pages[index]?.sections.length || 0);
        if (index >= 0 && section) {
          const at = typeof op.index === 'number' ? Math.max(0, Math.min(op.index, pages[index].sections.length)) : pages[index].sections.length;
          pages[index].sections.splice(at, 0, section);
        }
        break;
      }
      case 'update_section': {
        const index = findPageIndex(op);
        if (index < 0 || !op.sectionId) break;
        const sectionIndex = pages[index].sections.findIndex((section) => section.id === op.sectionId);
        if (sectionIndex < 0) break;
        const current = pages[index].sections[sectionIndex];
        const patch = safeObject(op.value);
        pages[index].sections[sectionIndex] = {
          ...current,
          ...(patch.type && SECTION_TYPES.includes(patch.type as TenantSiteSectionType) ? { type: patch.type as TenantSiteSectionType } : {}),
          ...(patch.visible !== undefined ? { visible: patch.visible !== false } : {}),
          content: { ...current.content, ...safeObject(patch.content) },
          settings: { ...current.settings, ...safeObject(patch.settings) },
        };
        break;
      }
      case 'remove_section': {
        const index = findPageIndex(op);
        if (index >= 0 && op.sectionId) pages[index].sections = pages[index].sections.filter((section) => section.id !== op.sectionId);
        break;
      }
      case 'move_section': {
        const index = findPageIndex(op);
        if (index < 0 || !op.sectionId || typeof op.index !== 'number') break;
        const sectionIndex = pages[index].sections.findIndex((section) => section.id === op.sectionId);
        if (sectionIndex < 0) break;
        const [section] = pages[index].sections.splice(sectionIndex, 1);
        pages[index].sections.splice(Math.max(0, Math.min(op.index, pages[index].sections.length)), 0, section);
        break;
      }
      case 'update_brand': {
        branding = { ...branding, ...safeObject(op.value) } as TenantSiteConfig['branding'];
        break;
      }
      case 'update_seo': {
        seo = { ...seo, ...safeObject(op.value) } as TenantSiteConfig['seo'];
        break;
      }
    }
  }

  pages = sanitizePages(pages);
  return ensureComposableSiteConfig({ ...next, branding, seo, pages });
}
