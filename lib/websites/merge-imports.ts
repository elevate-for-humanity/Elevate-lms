export type WebsiteImportResult = {
  originalUrl: string;
  extracted: {
    title: string;
    description: string;
    pageCount: number;
    imagesFound: number;
    productsFound?: number;
    colorsDetected: string[];
  };
  config: Record<string, any>;
};

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item).trim().toLowerCase();
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function mergeWebsiteImports(imports: WebsiteImportResult[]) {
  if (!imports.length) throw new Error('At least one website import is required');
  const primary = imports[0];
  if (!primary) throw new Error('Primary website import is required');
  const configs = imports.map((item) => item.config || {});
  const navigation = uniqueBy(configs.flatMap((config) => config.navigation || []), (item) => item.href || item.label || '');
  const programs = uniqueBy(configs.flatMap((config) => config.programs || []), (item) => item.name || item.title || '');
  const products = uniqueBy(configs.flatMap((config) => config.products || []), (item) => item.href || item.name || '');
  const features = uniqueBy(configs.flatMap((config) => config.homepage?.features || []), (item) => item.title || item.name || '');

  return {
    previewId: `merge_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    originalUrl: primary.originalUrl,
    sourceUrls: imports.map((item) => item.originalUrl),
    extracted: {
      title: primary.extracted.title,
      description: primary.extracted.description,
      pageCount: imports.reduce((total, item) => total + item.extracted.pageCount, 0),
      imagesFound: imports.reduce((total, item) => total + item.extracted.imagesFound, 0),
      productsFound: imports.reduce((total, item) => total + (item.extracted.productsFound || 0), 0),
      colorsDetected: [...new Set(imports.flatMap((item) => item.extracted.colorsDetected))],
    },
    comparison: imports.map((item) => ({
      url: item.originalUrl,
      title: item.extracted.title,
      pages: item.extracted.pageCount,
      images: item.extracted.imagesFound,
      products: item.extracted.productsFound || 0,
      navigationItems: item.config?.navigation?.length || 0,
      programs: item.config?.programs?.length || 0,
    })),
    config: {
      ...primary.config,
      homepage: { ...(primary.config.homepage || {}), features },
      navigation,
      programs,
      products,
      contact: configs.reduce((merged, config) => ({ ...merged, ...(config.contact || {}) }), {}),
      meta: {
        ...(primary.config.meta || {}),
        importedFrom: imports.map((item) => item.originalUrl),
        importedAt: new Date().toISOString(),
        importMode: 'multi-source',
      },
    },
  };
}
