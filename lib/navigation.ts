// lib/navigation.ts — Elevate for Humanity site-wide navigation config
// Single source of truth for the public marketing site header navigation.

import type { NavItem, NavSubItem } from '@/types/navigation';
import { ROUTES } from '@/lib/navigation/routes';

export type { NavItem, NavSubItem } from '@/types/navigation';

// Public navigation points to topic hubs; detailed choices live on those pages.
// Both desktop and mobile consume this exact list.
export const NAV_ITEMS: NavItem[] = [
  { id: 'programs', name: 'Programs', href: ROUTES.programs, subItems: [
    { name: 'All Programs', href: ROUTES.programs, isSectionLink: true },
    { name: 'Healthcare', href: ROUTES.programsHealthcare },
    { name: 'Skilled Trades & Transportation', href: '/programs/skilled-trades' },
    { name: 'Barber & Beauty', href: ROUTES.programsBeauty },
    { name: 'Business', href: '/programs/business-administration' },
    { name: 'Technology', href: ROUTES.programsTechnology },
    { name: 'All Microcourses', href: '/microclasses' },
  ] },
  { id: 'apprenticeships', name: 'Apprenticeships', href: ROUTES.apprenticeships, subItems: [
    { name: 'All Apprenticeships', href: ROUTES.apprenticeships },
    { name: 'All Host Sites', href: ROUTES.apprenticeshipsHostShop },
    { name: 'Become a Host Site', href: ROUTES.hostShopApply },
    { name: 'Barber & Beauty Network', href: '/barber-beauty-network' },
  ] },
  { id: 'testing', name: 'Testing', href: ROUTES.testing },
  { id: 'funding', name: 'Funding', href: ROUTES.funding, subItems: [
    { name: 'Compare Funding Options', href: ROUTES.funding },
    { name: 'Check Eligibility', href: ROUTES.eligibility },
  ] },
  { id: 'employers', name: 'Partners', href: '/partners', subItems: [
    { name: 'Partnership Options', href: '/partners' },
    { name: 'Hire Talent & Post Jobs', href: ROUTES.employers },
    { name: 'Browse Jobs', href: '/jobs' },
    { name: 'Employer Directory', href: '/employers/directory' },
    { name: 'Workforce Agencies', href: ROUTES.forAgencies },
    { name: 'Platform & Licensing', href: '/platform' },
  ] },
  { id: 'resources', name: 'Resources', href: '/resources', subItems: [
    { name: 'Student & Community Resources', href: '/resources' },
    { name: 'Student Dashboard', href: ROUTES.studentPortal, isAuth: true },
    { name: 'Choose Your Portal', href: '/online-apps' },
    { name: 'Student Support', href: '/student-support' },
    { name: 'Career Services', href: '/career-services' },
    { name: 'Community Hub', href: '/community' },
    { name: 'Community Services', href: '/services' },
    { name: 'Rise Forward Foundation', href: '/rise-forward-foundation' },
    { name: 'FAQ', href: ROUTES.faq },
    { name: 'Blog & Insights', href: ROUTES.blog },
  ] },
  { id: 'about', name: 'About', href: ROUTES.about, subItems: [
    { name: 'About Elevate', href: ROUTES.about },
    { name: 'Our Founder — Elizabeth Greene', href: '/about/elizabeth-greene' },
    { name: 'Our Team & Staff', href: '/about/team' },
    { name: 'Approvals', href: ROUTES.aboutApprovals },
    { name: 'Compliance & Accountability', href: '/compliance/center' },
    { name: 'Contact & Visit', href: ROUTES.contact },
  ] },
  { id: 'store', name: 'Store & Businesses', href: ROUTES.store, subItems: [
    { name: 'Elevate Store', href: ROUTES.store },
    { name: 'Curvature Body Sculpting', href: ROUTES.curvatureBodySculpting },
    { name: 'Supersonic Fast Cash', href: ROUTES.supersonicFastCash },
    { name: '2Exclusive Platinum Cleaning', href: ROUTES.platinumCleaning },
  ] },
];

export function findDuplicateNavHrefs(
  navItems: NavItem[],
): Array<{ href: string; items: NavItem[] }> {
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
