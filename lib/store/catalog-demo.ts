import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
import type { CommerceCatalogItem } from './commerce-catalog';

export function catalogDemo(item: CommerceCatalogItem) {
  if (item.id.startsWith('plan-')) return `/store/demo/plan/${item.id.slice(5)}`;
  if (['website-builder', 'sam-gov', 'grants'].includes(item.id))
    return `/store/demo/apps/${item.id}`;
  const capability = item.proofFeatureKeys.find((key) =>
    CAPABILITY_CATALOG.some((entry) => entry.key === key && entry.status !== 'internal'),
  );
  return capability ? `/store/demo/capability/${capability}` : `/store/demo/offer/${item.id}`;
}

export function catalogPoster(item: CommerceCatalogItem) {
  if (['website-builder', 'sam-gov', 'grants'].includes(item.id))
    return `/images/store-commercials/${item.id}.webp`;
  if (item.category === 'education') return '/images/programs/refresh-20261101/home.webp';
  if (item.category === 'workforce') return '/images/programs/refresh-20261101/employers.webp';
  return '/images/programs/refresh-20261101/business.webp';
}
