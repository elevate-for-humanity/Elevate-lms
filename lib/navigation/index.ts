// Re-export from lib/navigation.ts for backward compatibility
export * from '../navigation';

import { NAV_ITEMS, findDuplicateNavHrefs as _findDuplicateNavHrefs, NavItem, NavSubItem, groupNavSubItemsByHeader, getNavCategoryLabel } from '../navigation';

// Re-export with original names for test compatibility
export { NAV_ITEMS, groupNavSubItemsByHeader, getNavCategoryLabel };

// Alias for backward compatibility with tests expecting different signature
export function findDuplicateNavHrefs(items?: NavItem[]): { href: string; owners: string }[] {
  return _findDuplicateNavHrefs(items);
}
