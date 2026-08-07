// lib/navigation.ts — Elevate for Humanity site-wide navigation config
// Single source of truth for the public marketing site header navigation.
// Consumed by HeaderDesktopNav and HeaderMobileMenu.
//
// All routes come from lib/navigation/routes.ts to prevent drift.

import { type NavItem } from '@/types/navigation';
import { ROUTES } from '@/lib/navigation/routes';

export const NAV_ITEMS: NavItem[] = [
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
      { name: 'Check Eligibility', href: ROUTES.eligibility, isSectionLink: true },
    ],
  },
  {
    id: 'employers',
    name: 'Employers',
    href: ROUTES.employers,
    subItems: [
      { name: 'Hire Graduates', href: ROUTES.employersHireGraduates, isSectionLink: true },
      { name: 'Sponsor an Apprentice', href: ROUTES.apprenticeshipSponsor, isSectionLink: true },
      { name: 'Post a Job', href: ROUTES.employersPostJob, isSectionLink: true },
      { name: 'Employer Portal', href: ROUTES.employerPortal, isSectionLink: true, isAuth: true },
      { name: 'Workforce Agency Tools', href: ROUTES.forAgencies, isSectionLink: true },
      { name: 'Request Demo', href: ROUTES.storeDemo, isSectionLink: true },
    ],
  },
  {
    id: 'portals',
    name: 'Portals',
    subItems: [
      { name: 'Learners', isHeader: true },
      { name: 'Student Portal', href: ROUTES.studentPortal, isSectionLink: true, isAuth: true },
      { name: 'LMS Dashboard', href: ROUTES.lmsPortal, isSectionLink: true, isAuth: true },
      { name: 'Apprentice Portal', href: ROUTES.apprenticePortal, isSectionLink: true, isAuth: true },
      { name: 'Parent Portal', href: ROUTES.parentPortal, isSectionLink: true, isAuth: true },
      { name: 'Employers & Partners', isHeader: true },
      { name: 'Employer Portal', href: ROUTES.employerPortal, isSectionLink: true, isAuth: true },
      { name: 'Host Shop Portal', href: ROUTES.hostShopPortal, isSectionLink: true, isAuth: true },
      { name: 'Cosmetology Host Shop Portal', href: ROUTES.cosmetologyHostShopPortal, isSectionLink: true, isAuth: true },
      { name: 'Partner Portal', href: ROUTES.partnerPortal, isSectionLink: true, isAuth: true },
      { name: 'Workforce & Providers', isHeader: true },
      { name: 'Workforce Portal', href: ROUTES.workforcePortal, isSectionLink: true, isAuth: true },
      { name: 'Workforce Board Portal', href: ROUTES.workforceBoardPortal, isSectionLink: true, isAuth: true },
      { name: 'Case Manager Portal', href: ROUTES.caseManagerPortal, isSectionLink: true, isAuth: true },
      { name: 'Provider Portal', href: ROUTES.providerPortal, isSectionLink: true, isAuth: true },
      { name: 'Program Holder Portal', href: ROUTES.programHolderPortal, isSectionLink: true, isAuth: true },
      { name: 'Staff', isHeader: true },
      { name: 'Instructor Portal', href: ROUTES.instructorPortal, isSectionLink: true, isAuth: true },
      { name: 'Staff Portal', href: ROUTES.staffPortal, isSectionLink: true, isAuth: true },
      { name: 'Admin Portal', href: ROUTES.adminPortal, isSectionLink: true, isAuth: true },
    ],
  },
  {
    id: 'store',
    name: 'Store',
    href: ROUTES.store,
  },
  {
    id: 'about',
    name: 'About',
    href: ROUTES.about,
    subItems: [
      { name: 'Mission', href: '/about/mission', isSectionLink: true },
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
  const groups: Record<string, any[]> = {};
  let currentHeader = '';

  for (const item of navItems as any[]) {
    if (item.isHeader) {
      currentHeader = item.name;
      if (!groups[currentHeader]) groups[currentHeader] = [];
      groups[currentHeader].push(item);
      continue;
    }

    if (!groups[currentHeader]) groups[currentHeader] = [];
    groups[currentHeader].push(item);
  }

  return groups as Record<string, NavItem[]> | Record<string, import('@/types/navigation').NavSubItem[]>;
}

export function getNavCategoryLabel(column: import('@/types/navigation').NavSubItem[]): string {
  const header = column.find((item) => item.isHeader);
  return header?.name.replace(/—/g, '').trim() ?? '';
}
