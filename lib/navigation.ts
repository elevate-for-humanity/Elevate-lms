// lib/navigation.ts — Elevate for Humanity site-wide navigation config
// Single source of truth for the public marketing site header navigation.
// Consumed by HeaderDesktopNav and HeaderMobileMenu.
//
// HEADER NAV — student-focused, minimal. 5 top-level items + 2 action buttons.
// Sign In and Apply Now are on the right side only, NOT in the nav dropdown.
// Testing is moved to About dropdown. Employers has its own top-level item.

import { type NavItem } from '@/types/navigation';

export const NAV_ITEMS: NavItem[] = [
  // ── 1. Programs ──────────────────────────────────────────────────────────────
  {
    id: 'programs',
    name: 'Programs',
    href: '/programs',
    subItems: [
      { name: 'Healthcare', isHeader: true, href: '/programs/healthcare' },
      { name: 'CNA', href: '/programs/cna', isSectionLink: true },
      { name: 'QMA', href: '/programs/qma', isSectionLink: true },
      { name: 'Medical Assistant', href: '/programs/medical-assistant', isSectionLink: true },
      { name: 'Phlebotomy', href: '/programs/phlebotomy', isSectionLink: true },
      { name: 'Skilled Trades', isHeader: true, href: '/programs/skilled-trades' },
      { name: 'HVAC', href: '/programs/hvac-technician', isSectionLink: true },
      { name: 'CDL Training', href: '/programs/cdl-training', isSectionLink: true },
      { name: 'Beauty', isHeader: true, href: '/programs/beauty-cosmetology' },
      { name: 'Barber & Beauty', href: '/programs/barber-apprenticeship', isSectionLink: true },
      { name: 'Tech & Business', isHeader: true, href: '/programs/technology' },
      { name: 'IT Help Desk', href: '/programs/it-helpdesk', isSectionLink: true },
      { name: 'All Programs', href: '/programs', isSectionLink: true },
    ],
  },
  // ── 2. Apprenticeships ────────────────────────────────────────────────────────
  {
    id: 'apprenticeships',
    name: 'Apprenticeships',
    subItems: [
      { name: 'How It Works', href: '/apprenticeships/how-it-works', isSectionLink: true },
      { name: 'All Apprenticeships', href: '/apprenticeships', isSectionLink: true },
      { name: 'Programs', isHeader: true },
      { name: 'Barber', href: '/programs/barber-apprenticeship', isSectionLink: true },
      { name: 'Cosmetology', href: '/programs/cosmetology-apprenticeship', isSectionLink: true },
      { name: 'Esthetics', href: '/programs/esthetician-apprenticeship', isSectionLink: true },
      { name: 'Nail Technician', href: '/programs/nail-technician-apprenticeship', isSectionLink: true },
      { name: 'Host Shops', href: '/apprenticeships/host-shop', isSectionLink: true },
      { name: 'Employer Sponsorship', href: '/apprenticeship-sponsor', isSectionLink: true },
    ],
  },
  // ── 3. Funding ──────────────────────────────────────────────────────────────
  {
    id: 'funding',
    name: 'Funding',
    subItems: [
      { name: 'WIOA / WorkOne', href: '/funding/wioa', isSectionLink: true },
      { name: 'Workforce Ready Grant', href: '/funding/wioa', isSectionLink: true },
      { name: 'Job Ready Indy', href: '/funding/job-ready-indy', isSectionLink: true },
      { name: 'Vocational Rehabilitation', href: '/funding/voc-rehab', isSectionLink: true },
      { name: 'Scholarships', href: '/scholarships', isSectionLink: true },
      { name: 'Payment Plans', href: '/funding', isSectionLink: true },
      { name: 'Check Eligibility', href: '/eligibility/quiz', isSectionLink: true },
    ],
  },
  // ── 4. Employers ──────────────────────────────────────────────────────────────
  {
    id: 'employers',
    name: 'Employers',
    subItems: [
      { name: 'Hire Graduates', href: '/hire-graduates', isSectionLink: true },
      { name: 'Sponsor an Apprentice', href: '/apprenticeship-sponsor', isSectionLink: true },
      { name: 'Post a Job', href: '/employers/post-job', isSectionLink: true },
      { name: 'Employer Portal', href: '/employers', isSectionLink: true },
      { name: 'Workforce Agency Tools', href: '/for-agencies', isSectionLink: true },
      { name: 'Request Demo', href: '/store/demo', isSectionLink: true },
    ],
  },
  // ── 5. About ───────────────────────────────────────────────────────────────
  {
    id: 'about',
    name: 'About',
    subItems: [
      { name: 'Mission', href: '/about', isSectionLink: true },
      { name: 'Locations', href: '/about/locations', isSectionLink: true },
      { name: 'Success Stories', href: '/success-stories', isSectionLink: true },
      { name: 'Testing Center', href: '/testing', isSectionLink: true },
      { name: 'Approvals', href: '/about/approvals', isSectionLink: true },
      { name: 'Blog', href: '/blog', isSectionLink: true },
      { name: 'FAQ', href: '/faq', isSectionLink: true },
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
    .filter(({ 1: items }) => items.length > 1)
    .map(({ 0: href, 1: items }) => ({ href, items }));
}

export function groupNavSubItemsByHeader(navItems: NavItem[]): Record<string, NavItem[]>;
export function groupNavSubItemsByHeader(navItems: import('@/types/navigation').NavSubItem[]): Record<string, import('@/types/navigation').NavSubItem[]>;
export function groupNavSubItemsByHeader(navItems: NavItem[] | import('@/types/navigation').NavSubItem[]): Record<string, NavItem[]> | Record<string, import('@/types/navigation').NavSubItem[]> {
  const groups: Record<string, NavItem[]> = {};
  for (const item of navItems) {
    const header = item.isHeader ? item.name : '';
    if (!groups[header]) groups[header] = [];
    groups[header].push(item);
  }
  return groups;
}

export function getNavCategoryLabel(column: import('@/types/navigation').NavSubItem[]): string {
  const header = column.find((item) => item.isHeader);
  return header?.name.replace(/—/g, '').trim() ?? '';
}
