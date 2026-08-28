// lib/navigation.ts — Elevate for Humanity site-wide navigation config
// Single source of truth for the public marketing site header navigation.

import type { NavItem, NavSubItem } from '@/types/navigation';
import { ROUTES } from '@/lib/navigation/routes';

export type { NavItem, NavSubItem } from '@/types/navigation';

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'programs',
    name: 'Programs',
    href: ROUTES.programs,
    subItems: [
      { name: 'All Programs', href: ROUTES.programs, isSectionLink: true },
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
      { name: 'Tech & Business', isHeader: true },
      { name: 'Technology Programs', href: ROUTES.programsTechnology, isSectionLink: true },
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
    id: 'platform',
    name: 'Platform',
    href: '/platform',
    subItems: [
      { name: 'Platform Overview', href: '/platform', isSectionLink: true },
      { name: 'Online Apps & Portals', href: '/online-apps', isSectionLink: true },
      { name: 'Workforce Board Platform', href: '/platform/workforce-boards', isSectionLink: true },
      { name: 'Dev Studio', href: '/store/dev-studio', isSectionLink: true },
      { name: 'Website Builder', href: '/store', isSectionLink: true },
      { name: 'Plans & Products', href: '/store#marketplace', isSectionLink: true },
    ],
  },
  {
    id: 'employers',
    name: 'Employers',
    href: ROUTES.employers,
    subItems: [
      { name: 'Hire Graduates', href: ROUTES.employersHireGraduates, isSectionLink: true },
      { name: 'Become a Host Site', href: ROUTES.apprenticeshipsHostShop, isSectionLink: true },
      { name: 'Post a Job', href: ROUTES.employersPostJob, isSectionLink: true },
      { name: 'Workforce Agency Tools', href: ROUTES.forAgencies, isSectionLink: true },
      { name: 'Request Demo', href: ROUTES.storeDemo, isSectionLink: true },
    ],
  },
  {
    id: 'resources',
    name: 'Resources',
    href: ROUTES.blog,
    subItems: [
      { name: 'Blog & Insights', href: ROUTES.blog, isSectionLink: true },
      { name: 'FAQ', href: ROUTES.faq, isSectionLink: true },
      { name: 'Approvals', href: ROUTES.aboutApprovals, isSectionLink: true },
      { name: 'Testing Center', href: ROUTES.testing, isSectionLink: true },
      { name: 'Contact', href: ROUTES.contact, isSectionLink: true },
    ],
  },
  {
    id: 'portals',
    name: 'Portals',
    href: '/online-apps',
    subItems: [
      { name: 'All Apps & Portals', href: '/online-apps', isSectionLink: true },
      { name: 'Learners', isHeader: true },
      { name: 'Student / LMS Portal', href: ROUTES.studentPortal, isSectionLink: true, isAuth: true },
      { name: 'Apprentice Portal', href: ROUTES.apprenticePortal, isSectionLink: true, isAuth: true },
      { name: 'Parent Portal', href: ROUTES.parentPortal, isSectionLink: true, isAuth: true },
      { name: 'Employers & Host Sites', isHeader: true },
      { name: 'Employer Portal', href: ROUTES.employerPortal, isSectionLink: true, isAuth: true },
      { name: 'Host Site Portal', href: ROUTES.hostShopPortal, isSectionLink: true, isAuth: true },
      { name: 'Workforce & Providers', isHeader: true },
      { name: 'Workforce Portal', href: ROUTES.workforcePortal, isSectionLink: true, isAuth: true },
      { name: 'Workforce Board Portal', href: ROUTES.workforceBoardPortal, isSectionLink: true, isAuth: true },
      { name: 'Case Manager Portal', href: ROUTES.caseManagerPortal, isSectionLink: true, isAuth: true },
      { name: 'Provider Portal', href: ROUTES.providerPortal, isSectionLink: true, isAuth: true },
      { name: 'Program Holder Portal', href: ROUTES.programHolderPortal, isSectionLink: true, isAuth: true },
      { name: 'Staff & Platform', isHeader: true },
      { name: 'Instructor Portal', href: ROUTES.instructorPortal, isSectionLink: true, isAuth: true },
      { name: 'Staff Portal', href: ROUTES.staffPortal, isSectionLink: true, isAuth: true },
      { name: 'Testing Center Operations', href: ROUTES.testingPortal, isSectionLink: true, isAuth: true },
      { name: 'Creator Studio', href: ROUTES.creatorPortal, isSectionLink: true, isAuth: true },
      { name: 'Admin Portal', href: ROUTES.adminPortal, isSectionLink: true, isAuth: true },
    ],
  },
  { id: 'store', name: 'Store', href: ROUTES.store },
  {
    id: 'foundation',
    name: 'Foundation',
    href: '/rise-forward-foundation',
  },
  {
    id: 'about',
    name: 'About',
    href: ROUTES.about,
    subItems: [
      { name: 'Mission', href: ROUTES.about, isSectionLink: true },
      { name: 'Apprenticeship Sponsor of Record', href: ROUTES.apprenticeshipSponsor, isSectionLink: true },
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
