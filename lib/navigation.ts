// lib/navigation.ts — Elevate for Humanity site-wide navigation config
// Single source of truth for the public marketing site header navigation.
// Consumed by HeaderDesktopNav and HeaderMobileMenu.
//
// HEADER NAV — student-focused, minimal. 6 top-level items.
// Portals, platform tools, employer-only, and staff links live in the footer.

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
      { name: 'Building Services', href: '/programs/building-technician', isSectionLink: true },
      { name: 'CDL Training', href: '/programs/cdl-training', isSectionLink: true },
      { name: 'Beauty', isHeader: true, href: '/programs/beauty-cosmetology' },
      { name: 'Barber', href: '/programs/barber-apprenticeship', isSectionLink: true },
      { name: 'Cosmetology', href: '/programs/cosmetology-apprenticeship', isSectionLink: true },
      { name: 'Esthetics', href: '/programs/esthetician-apprenticeship', isSectionLink: true },
      { name: 'Nail Technician', href: '/programs/nail-technician-apprenticeship', isSectionLink: true },
      { name: 'Tech & Business', isHeader: true, href: '/programs/technology' },
      { name: 'IT Help Desk', href: '/programs/it-helpdesk', isSectionLink: true },
      { name: 'Cybersecurity', href: '/programs/cybersecurity', isSectionLink: true },
      { name: 'Bookkeeping', href: '/programs/bookkeeping', isSectionLink: true },
      { name: 'View All Programs', href: '/programs', isSectionLink: true },
    ],
  },
  // ── 2. Apprenticeships ────────────────────────────────────────────────────────
  {
    id: 'apprenticeships',
    name: 'Apprenticeships',
    subItems: [
      { name: 'Explore', isHeader: true },
      { name: 'All Apprenticeships', href: '/apprenticeships', isSectionLink: true },
      { name: 'How It Works', href: '/apprenticeships/how-it-works', isSectionLink: true },
      { name: 'Earn While You Learn', href: '/apprenticeships/earn-while-you-learn', isSectionLink: true },
      { name: 'FAQs', href: '/apprenticeships/faq', isSectionLink: true },
      { name: 'Programs', isHeader: true },
      { name: 'Barber', href: '/programs/barber-apprenticeship', isSectionLink: true },
      { name: 'Cosmetology', href: '/programs/cosmetology-apprenticeship', isSectionLink: true },
      { name: 'Esthetics', href: '/programs/esthetician-apprenticeship', isSectionLink: true },
      { name: 'Nail Technician', href: '/programs/nail-technician-apprenticeship', isSectionLink: true },
      { name: 'Skilled Trades', href: '/programs/hvac-technician', isSectionLink: true },
      { name: 'For Employers', isHeader: true },
      { name: 'Host Shop Info', href: '/apprenticeships/host-shop', isSectionLink: true },
      { name: 'Sponsor an Apprentice', href: '/apprenticeships/sponsor', isSectionLink: true },
      { name: 'Refer an Apprentice', href: '/apprenticeships/refer', isSectionLink: true },
    ],
  },
  // ── 3. Testing ─────────────────────────────────────────────────────────────
  {
    id: 'testing',
    name: 'Testing',
    subItems: [
      { name: 'Exams', isHeader: true },
      { name: 'NHA', href: '/testing/nha', isSectionLink: true },
      { name: 'EPA 608', href: '/testing/epa-608', isSectionLink: true },
      { name: 'Certiport', href: '/testing/certiport', isSectionLink: true },
      { name: 'ACT WorkKeys', href: '/testing/act-workkeys', isSectionLink: true },
      { name: 'All Exams', href: '/testing', isSectionLink: true },
      { name: 'For Candidates', isHeader: true },
      { name: 'Book an Exam', href: '/testing/book', isSectionLink: true },
      { name: 'Requirements', href: '/testing/requirements', isSectionLink: true },
      { name: 'Accommodations', href: '/testing/accommodations', isSectionLink: true },
      { name: 'Verify a Credential', href: '/testing/verify', isSectionLink: true },
    ],
  },
  // ── 4. Funding ──────────────────────────────────────────────────────────────
  {
    id: 'funding',
    name: 'Funding',
    subItems: [
      { name: 'Funding Options', isHeader: true },
      { name: 'WIOA / WorkOne', href: '/funding/wioa', isSectionLink: true },
      { name: 'Workforce Ready Grant', href: '/funding/workforce-ready', isSectionLink: true },
      { name: 'Job Ready Indy', href: '/funding/job-ready-indy', isSectionLink: true },
      { name: 'Vocational Rehabilitation', href: '/funding/voc-rehab', isSectionLink: true },
      { name: 'Payment', isHeader: true },
      { name: 'Self-Pay Plans', href: '/funding/self-pay', isSectionLink: true },
      { name: 'Scholarships', href: '/funding/scholarships', isSectionLink: true },
      { name: 'Check My Eligibility', href: '/apply/eligibility', isSectionLink: true },
    ],
  },
  // ── 5. About ───────────────────────────────────────────────────────────────
  {
    id: 'about',
    name: 'About',
    subItems: [
      { name: 'Our Mission', href: '/about', isSectionLink: true },
      { name: 'Locations', href: '/about/locations', isSectionLink: true },
      { name: 'Success Stories', href: '/success-stories', isSectionLink: true },
      { name: 'Contact Us', href: '/contact', isSectionLink: true },
      { name: 'Trust & Compliance', isHeader: true },
      { name: 'Approvals & Accreditations', href: '/about/approvals', isSectionLink: true },
      { name: 'Policies', href: '/about/policies', isSectionLink: true },
      { name: 'Accessibility', href: '/about/accessibility', isSectionLink: true },
      { name: 'Resources', isHeader: true },
      { name: 'Blog', href: '/blog', isSectionLink: true },
      { name: 'FAQ', href: '/faq', isSectionLink: true },
      { name: 'Donate', href: '/donate', isSectionLink: true },
    ],
  },
  // ── 6. Apply ────────────────────────────────────────────────────────────────
  {
    id: 'apply',
    name: 'Apply',
    subItems: [
      { name: 'Apply Now', href: '/apply', isSectionLink: true },
      { name: 'Check Eligibility', href: '/apply/eligibility', isSectionLink: true },
      { name: 'Track Application', href: '/apply/track', isSectionLink: true },
      { name: 'For Employers', isHeader: true },
      { name: 'Hire Our Grads', href: '/employers/hire', isSectionLink: true },
      { name: 'Sponsor an Apprentice', href: '/employers/sponsor', isSectionLink: true },
      { name: 'Platform', isHeader: true },
      { name: 'Platform Overview', href: '/store', isSectionLink: true },
      { name: 'Request Demo', href: '/store/demo', isSectionLink: true },
      { name: 'Sign In', href: '/login', isSectionLink: true },
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
