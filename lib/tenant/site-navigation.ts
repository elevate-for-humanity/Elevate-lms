import type { TenantSiteLinkGroup, TenantSitePage } from './site-types';

/** Resolve only saved pages from this site. Stable IDs survive page renames. */
export function resolveSiteLinkGroups(groups: unknown, pages: TenantSitePage[]) {
  if (!Array.isArray(groups)) return [];
  return groups.slice(0, 8).flatMap((value: unknown, index) => {
    if (!value || typeof value !== 'object') return [];
    const group = value as TenantSiteLinkGroup;
    if (typeof group.label !== 'string' || !group.label.trim() || !Array.isArray(group.pageIds)) return [];
    const ids = [...new Set(group.pageIds.filter((id): id is string => typeof id === 'string'))];
    const links = ids.flatMap(id => { const page = pages.find(page => page.id === id); return page ? [page] : []; });
    return links.length ? [{ id: `${index}-${group.label}`, label: group.label.trim(), links }] : [];
  });
}
