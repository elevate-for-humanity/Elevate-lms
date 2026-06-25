export * from './navigation-config';

export const NAV_ITEMS: Array<{id: string; label: string; href?: string; subItems?: unknown[]; isHeader?: boolean}> = [
  { id: 'apply', label: 'Apply', href: '/apply', subItems: [] },
];
