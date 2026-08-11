// lib/navigation.ts — Elevate for Humanity public navigation
// Premium humanitarian-hub information architecture. Public navigation stays
// mission-oriented; authenticated role portals remain behind the Sign In entry.

import type { NavItem, NavSubItem } from '@/types/navigation';

export type { NavItem, NavSubItem } from '@/types/navigation';

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'explore-hub',
    name: 'Explore Hub',
    href: '/what-we-do',
    subItems: [
      { name: 'Education & Learning', isHeader: true, href: '/programs' },
      { name: 'Training Programs', href: '/programs', isSectionLink: true },
      { name: 'Learning Management System', href: 'https://app.elevateforhumanity.org/lms', isSectionLink: true },
      { name: 'Hands-On Learning', href: '/what-we-do', isSectionLink: true },
      { name: 'Testing & Proctoring', href: '/testing', isSectionLink: true },
      { name: 'Credentials', href: '/credentials', isSectionLink: true },
      { name: 'Work-Based Learning', isHeader: true, href: '/apprenticeships' },
      { name: 'Registered Apprenticeships', href: '/apprenticeships', isSectionLink: true },
      { name: 'Career Services', href: '/career-services', isSectionLink: true },
      { name: 'Employment Support', href: '/employment-support', isSectionLink: true },
    ],
  },
  {
    id: 'funding-support',
    name: 'Funding & Support',
    href: '/funding',
    subItems: [
      { name: 'Workforce Funding', isHeader: true, href: '/funding' },
      { name: 'Funding Overview', href: '/funding', isSectionLink: true },
      { name: 'WIOA / WorkOne', href: '/funding/wioa', isSectionLink: true },
      { name: 'Workforce Ready Grant', href: '/funding/wrg', isSectionLink: true },
      { name: 'Job Ready Indy', href: '/funding/job-ready-indy', isSectionLink: true },
      { name: 'Vocational Rehabilitation', href: '/funding/vocational-rehabilitation', isSectionLink: true },
      { name: 'Check Eligibility', href: '/eligibility', isSectionLink: true },
      { name: 'Humanitarian Support', isHeader: true, href: '/rise-forward-foundation' },
      { name: 'Rise Forward Foundation', href: '/rise-forward-foundation', isSectionLink: true },
      { name: 'Community Services', href: '/community-services', isSectionLink: true },
    ],
  },
  {
    id: 'partners',
    name: 'Partners',
    href: '/partners',
    subItems: [
      { name: 'Workforce Ecosystem', isHeader: true, href: '/partners' },
      { name: 'Employers', href: '/employer', isSectionLink: true },
      { name: 'Host Sites', href: '/partners/host-shops', isSectionLink: true },
      { name: 'Workforce Agencies', href: '/for-agencies', isSectionLink: true },
      { name: 'Training Providers', href: '/for-providers', isSectionLink: true },
      { name: 'Government & Community', href: '/partners', isSectionLink: true },
      { name: 'Partner Resources', href: '/resources', isSectionLink: true },
    ],
  },
  {
    id: 'ai-platform',
    name: 'AI Platform',
    href: '/platform',
    subItems: [
      { name: 'Connected Infrastructure', isHeader: true, href: '/platform' },
      { name: 'Platform Overview', href: '/platform', isSectionLink: true },
      { name: 'Learning Management System', href: 'https://app.elevateforhumanity.org/lms', isSectionLink: true },
      { name: 'Workforce Technology', href: '/partners/technology', isSectionLink: true },
      { name: 'Employer & Partner Tools', href: '/platform', isSectionLink: true },
      { name: 'Elevate Solutions Store', href: '/store', isSectionLink: true },
    ],
  },
  {
    id: 'about',
    name: 'About',
    href: '/about',
    subItems: [
      { name: 'Mission & Impact', isHeader: true, href: '/about' },
      { name: 'About Elevate', href: '/about', isSectionLink: true },
      { name: 'What We Do', href: '/what-we-do', isSectionLink: true },
      { name: 'Impact & Results', href: '/impact', isSectionLink: true },
      { name: 'Institutional Trust', isHeader: true },
      { name: 'Approvals', href: '/about/approvals', isSectionLink: true },
      { name: 'DOL Apprenticeship Sponsor', href: '/apprenticeship-sponsor', isSectionLink: true },
      { name: 'Testing Center', href: '/testing', isSectionLink: true },
      { name: 'Compliance & Transparency', href: '/compliance', isSectionLink: true },
      { name: 'Contact', href: '/contact', isSectionLink: true },
    ],
  },
];

export function findDuplicateNavHrefs(navItems: NavItem[]): Array<{ href: string; items: NavItem[] }> {
  const hrefMap = new Map<string, NavItem[]>();
  for (const item of navItems) {
    if (!item.href) continue;
    const existing = hrefMap.get(item.href) || [];
    hrefMap.set(item.href, [...existing, item]);
  }
  return Array.from(hrefMap.entries())
    .filter(([, items]) => items.length > 1)
    .map(([href, items]) => ({ href, items }));
}

export function groupNavSubItemsByHeader(navItems: NavSubItem[]): Record<string, NavSubItem[]> {
  const groups: Record<string, NavSubItem[]> = {};
  let currentHeader = '';

  for (const item of navItems) {
    if (item.isHeader) {
      currentHeader = item.name;
      if (!groups[currentHeader]) groups[currentHeader] = [];
      groups[currentHeader].push(item);
      continue;
    }
    if (!groups[currentHeader]) groups[currentHeader] = [];
    groups[currentHeader].push(item);
  }
  return groups;
}

export function getNavCategoryLabel(column: NavSubItem[]): string {
  const header = column.find((item) => item.isHeader);
  return header?.name.replace(/—/g, '').trim() ?? '';
}
