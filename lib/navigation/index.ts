export * from './navigation-config';

export const NAV_ITEMS: Array<{id: string; label: string; href?: string; subItems?: unknown[]; isHeader?: boolean}> = [
  { id: 'apply', label: 'Apply', href: '/apply', subItems: [] },
];

interface NavItemType { id: string; label: string; href?: string; subItems?: NavItemType[]; isHeader?: boolean }

export function findDuplicateNavHrefs(items: NavItemType[]): string[] {
  const hrefs: string[] = [];
  for (const item of items) {
    if (item.href) hrefs.push(item.href);
    if (item.subItems) {
      for (const sub of item.subItems) {
        if (sub.href) hrefs.push(sub.href);
      }
    }
  }
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const href of hrefs) {
    if (seen.has(href)) duplicates.push(href);
    seen.add(href);
  }
  return duplicates;
}
