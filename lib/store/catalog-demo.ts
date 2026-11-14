import type { CommerceCatalogItem } from './commerce-catalog';

export function catalogDemo(item: CommerceCatalogItem) {
  if (item.id.startsWith('plan-')) return `/store/demo/plan/${item.id.slice(5)}`;
  if (['website-builder', 'sam-gov', 'grants'].includes(item.id))
    return `/store/demo/apps/${item.id}`;
  return `/store/demo/offer/${item.id}`;
}

const APP_POSTERS: Record<string, string> = {
  'website-builder': '/images/store-commercials/website-builder.webp',
  'sam-gov': '/images/store-commercials/sam-gov.webp',
  grants: '/images/store-commercials/grants.webp',
};

export function catalogPoster(item: CommerceCatalogItem) {
  // Only product-specific artwork belongs on a product preview.
  return APP_POSTERS[item.id];
}
