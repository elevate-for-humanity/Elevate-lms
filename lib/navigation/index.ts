export * from './navigation-config';

export const NAV_ITEMS: Array<{id: string; label: string; href?: string; subItems?: unknown[]; isHeader?: boolean}> = [
  { id: 'apply', label: 'Apply', href: '/apply', subItems: [] },
];

interface NavItemType { id: string; label: string; href?: string; subItems?: NavItemType[]; isHeader?: boolean }

export function findDuplicateNavHrefs(items?: NavItemType[]): NavItemType[] {
  const itemsToCheck = items ?? NAV_ITEMS;
  if (!itemsToCheck || itemsToCheck.length === 0) return [];
  const seen = new Map<string, NavItemType>();
  const duplicates: NavItemType[] = [];
  
  function processItem(item: NavItemType) {
    if (item.href) {
      if (seen.has(item.href)) {
        duplicates.push(item);
      } else {
        seen.set(item.href, item);
      }
    }
    if (item.subItems) {
      for (const sub of item.subItems) {
        processItem(sub);
      }
    }
  }
  
  for (const item of itemsToCheck) {
    processItem(item);
  }
  return duplicates;
}
