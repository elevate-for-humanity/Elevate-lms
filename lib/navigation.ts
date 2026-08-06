// lib/navigation.ts — Elevate for Humanity site-wide navigation config
// Single source of truth for the public marketing site header navigation.
// Consumed by HeaderDesktopNav and HeaderMobileMenu.
//
// All routes come from lib/navigation/routes.ts to prevent drift.

import { type NavItem } from '@/types/navigation';
import { ROUTES } from '@/lib/navigation/routes';

export const NAV_ITEMS: NavItem[] = [
  // ── 1. Programs ──────────────────────────────────────────────────────────────
  {
    id: 'programs',
    name: 'Programs',
    href: ROUTES.programs,
    subItems: [
      { name: 'Healthcare', isHeader: true, href: ROUTES.programsHealthcare },
      { name: 'CNA', href: ROUTES.programsCNA, isSectionLink: true },
      { name: 'QMA', href: ROUTES.programsQMA, isSectionLink: true },
      { name: 'Medical Assistant', href: ROUTES.programsMedicalAssistant, isSectionLink: true },
      { name: 'Phlebotomy', href: ROUTES.programsPhlebotomy, isSectionLink: true },
      { name: 'Skilled Trades', isHeader: true, href: '/programs/skilled-trades' },
      { name: 'HVAC', href: ROUTES.programsHVAC, isSectionLink: true },
      { name: 'CDL Training', href: ROUTES.programsCDL, isSectionLink: true },
      { name: 'Beauty', isHeader: true, href: ROUTES.programsBeauty },
      { name: 'Barber & Beauty', href: ROUTES.programsBarber, isSectionLink: true },
      { name: 'Tech & Business', isHeader: true, href: ROUTES.programsTechnology },
      { name: 'IT Help Desk', href: ROUTES.programsIT, isSectionLink: true },
      { name: 'All Programs', href: ROUTES.programs, isSectionLink: true },
    ],
  },
  // ── 2. Apprenticeships ────────────────────────────────────────────────────────
  {
    id: 'apprenticeships',
    name: 'Apprenticeships',
    href: ROUTES.apprenticeships,
    subItems: [
      { name: 'How It Works', href: ROUTES.apprenticeshipsHowItWorks, isSectionLink: true },
      { name: 'All Apprenticeships', href: ROUTES.apprenticeships, isSectionLink: true },
      { name: 'Programs', isHeader: true },
      { name: 'Barber', href: ROUTES.programsBarber, isSectionLink: true },
      { name: 'Cosmetology', href: ROUTES.programsCosmetology, isSectionLink: true },
      { name: 'Esthetics', href: ROUTES.programsEsthetician, isSectionLink: true },
      { name: 'Nail Technician', href: ROUTES.programsNailTech, isSectionLink: true },
      { name: 'Host Shops', href: ROUTES.apprenticeshipsHostShop, isSectionLink: true },
      { name: 'Employer Sponsorship', href: ROUTES.apprenticeshipSponsor, isSectionLink: true },
    ],
  },
  // ── 3. Funding ──────────────────────────────────────────────────────────────
  {
    id: 'funding',
    name: 'Funding',
    href: ROUTES.funding,
    subItems: [
      { name: 'WIOA / WorkOne', href: ROUTES.fundingWIOA, isSectionLink: true },
      { name: 'Workforce Ready Grant', href: '/funding/wrg', isSectionLink: true },
      { name: 'Job Ready Indy', href: ROUTES.fundingJobReadyIndy, isSectionLink: true },
      { name: 'Vocational Rehabilitation', href: ROUTES.fundingVocRehab, isSectionLink: true },
      { name: 'Scholarships', href: ROUTES.scholarships, isSectionLink: true },
      { name: 'Payment Plans', href: ROUTES.funding, isSectionLink: true },
      { name: 'Check Eligibility', href: ROUTES.eligibility, isSectionLink: true },
    ],
  },
  // ── 4. Employers ──────────────────────────────────────────────────────────────
  {
    id: 'employers',
    name: 'Employers',
    href: ROUTES.employers,
    subItems: [
      { name: 'Hire Graduates', href: ROUTES.employersHireGraduates, isSectionLink: true },
      { name: 'Sponsor an Apprentice', href: ROUTES.apprenticeshipSponsor, isSectionLink: true },
      { name: 'Post a Job', href: ROUTES.employersPostJob, isSectionLink: true },
      { name: 'Employer Portal', href: ROUTES.employersPostJob, isSectionLink: true },
      { name: 'Workforce Agency Tools', href: ROUTES.forAgencies, isSectionLink: true },
      { name: 'Request Demo', href: ROUTES.storeDemo, isSectionLink: true },
    ],
  },
  // ── 5. About ───────────────────────────────────────────────────────────────
  {
    id: 'about',
    name: 'About',
    href: ROUTES.about,
    subItems: [
      { name: 'Mission', href: ROUTES.about, isSectionLink: true },
      { name: 'Success Stories', href: ROUTES.successStories, isSectionLink: true },
      { name: 'Testing Center', href: ROUTES.testing, isSectionLink: true },
      { name: 'Approvals', href: ROUTES.aboutApprovals, isSectionLink: true },
      { name: 'Blog', href: ROUTES.blog, isSectionLink: true },
      { name: 'FAQ', href: ROUTES.faq, isSectionLink: true },
      { name: 'Contact', href: ROUTES.contact, isSectionLink: true },
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
