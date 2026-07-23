// lib/navigation.ts — Elevate for Humanity site-wide navigation config
// Single source of truth for the public marketing site header navigation.
// Consumed by HeaderDesktopNav and HeaderMobileMenu.

import { type NavItem } from '@/types/navigation';

export const NAV_ITEMS: NavItem[] = [
  // ── 1. Programs — 4-column mega-menu ──────────────────────────────────────
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
  // ── 2. Apprenticeships — Explore / Programs / Partner / Current Users ────────
  {
    id: 'apprenticeships',
    name: 'Apprenticeships',
    subItems: [
      { name: 'Explore', isHeader: true },
      { name: 'All Apprenticeships', href: '/apprenticeships', isSectionLink: true },
      { name: 'How Apprenticeships Work', href: '/apprenticeships/how-it-works', isSectionLink: true },
      { name: 'Earn While You Learn', href: '/apprenticeships/earn-while-you-learn', isSectionLink: true },
      { name: 'Apprenticeship FAQs', href: '/apprenticeships/faq', isSectionLink: true },
      { name: 'Programs', isHeader: true },
      { name: 'Barber', href: '/programs/barber-apprenticeship', isSectionLink: true },
      { name: 'Cosmetology', href: '/programs/cosmetology-apprenticeship', isSectionLink: true },
      { name: 'Esthetics', href: '/programs/esthetician-apprenticeship', isSectionLink: true },
      { name: 'Nail Technician', href: '/programs/nail-technician-apprenticeship', isSectionLink: true },
      { name: 'Skilled Trades', href: '/programs/hvac-technician', isSectionLink: true },
      { name: 'Become a Partner', isHeader: true },
      { name: 'Become a Host Shop', href: '/apprenticeships/host-shop', isSectionLink: true },
      { name: 'Employer Sponsorship', href: '/apprenticeships/sponsor', isSectionLink: true },
      { name: 'Become a Mentor', href: '/apprenticeships/mentor', isSectionLink: true },
      { name: 'Refer an Apprentice', href: '/apprenticeships/refer', isSectionLink: true },
      { name: 'Current Users', isHeader: true },
      { name: 'Apprentice Portal', href: '/portal/apprentice', isSectionLink: true, isAuth: true },
      { name: 'Host Shop Portal', href: '/portal/host-shop', isSectionLink: true, isAuth: true },
      { name: 'Employer Portal', href: '/portal/employer', isSectionLink: true, isAuth: true },
    ],
  },
  // ── 3. Testing — Exams / Candidates / Organizations ─────────────────────────
  {
    id: 'testing',
    name: 'Testing',
    subItems: [
      { name: 'Exams', isHeader: true },
      { name: 'NHA', href: '/testing/nha', isSectionLink: true },
      { name: 'EPA 608', href: '/testing/epa-608', isSectionLink: true },
      { name: 'Certiport', href: '/testing/certiport', isSectionLink: true },
      { name: 'ACT WorkKeys', href: '/testing/act-workkeys', isSectionLink: true },
      { name: 'All Testing Services', href: '/testing', isSectionLink: true },
      { name: 'Candidates', isHeader: true },
      { name: 'Book an Exam', href: '/testing/book', isSectionLink: true },
      { name: 'Testing Requirements', href: '/testing/requirements', isSectionLink: true },
      { name: 'Accommodations', href: '/testing/accommodations', isSectionLink: true },
      { name: 'Retesting', href: '/testing/retest', isSectionLink: true },
      { name: 'Candidate Portal', href: '/portal/testing', isSectionLink: true, isAuth: true },
      { name: 'Organizations', isHeader: true },
      { name: 'Become a Testing Partner', href: '/testing/partner', isSectionLink: true },
      { name: 'Proctor Portal', href: '/portal/proctor', isSectionLink: true, isAuth: true },
      { name: 'Testing Center Services', href: '/testing/services', isSectionLink: true },
      { name: 'Verify a Credential', href: '/testing/verify', isSectionLink: true },
    ],
  },
  // ── 4. Platform — renamed from Store; distinct destinations ───────────────
  {
    id: 'store',
    name: 'Platform',
    subItems: [
      { name: 'Platform', isHeader: true },
      { name: 'Platform Overview', href: '/store', isSectionLink: true },
      { name: 'Training Provider Solution', href: '/store/training-provider', isSectionLink: true },
      { name: 'Employer Solution', href: '/store/employer', isSectionLink: true },
      { name: 'Workforce Agency Solution', href: '/store/workforce-agency', isSectionLink: true },
      { name: 'Enterprise', href: '/store/enterprise', isSectionLink: true },
      { name: 'Tools', isHeader: true },
      { name: 'Grant Discovery', href: '/store/grant-discovery', isSectionLink: true },
      { name: 'SAM.gov Assistant', href: '/store/samgov', isSectionLink: true },
      { name: 'Website Builder', href: '/store/website-builder', isSectionLink: true },
      { name: 'Resources', isHeader: true },
      { name: 'Capital Readiness Guide', href: '/store/capital-readiness', isSectionLink: true },
      { name: 'Licensing Guide', href: '/store/licensing-guide', isSectionLink: true },
      { name: 'All Guides', href: '/store/guides', isSectionLink: true },
      { name: 'Pricing', isHeader: true },
      { name: 'Plans', href: '/store/pricing', isSectionLink: true },
      { name: 'Request Demo', href: '/store/demo', isSectionLink: true },
    ],
  },
  // ── 5. Funding — public options first ─────────────────────────────────────
  {
    id: 'funding',
    name: 'Funding',
    subItems: [
      { name: 'Funding Options', isHeader: true },
      { name: 'WIOA / WorkOne', href: '/funding/wioa', isSectionLink: true },
      { name: 'Workforce Ready Grant', href: '/funding/workforce-ready', isSectionLink: true },
      { name: 'Job Ready Indy', href: '/funding/job-ready-indy', isSectionLink: true },
      { name: 'Vocational Rehabilitation', href: '/funding/voc-rehab', isSectionLink: true },
      { name: 'Employer-Sponsored Training', href: '/funding/employer-sponsored', isSectionLink: true },
      { name: 'Payment Options', isHeader: true },
      { name: 'Self-Pay', href: '/funding/self-pay', isSectionLink: true },
      { name: 'Payment Plans', href: '/funding/payment-plans', isSectionLink: true },
      { name: 'Scholarships', href: '/funding/scholarships', isSectionLink: true },
      { name: 'For Employers', isHeader: true },
      { name: 'OJT Wage Reimbursement', href: '/funding/ojt', isSectionLink: true },
      { name: 'WOTC Tax Credits', href: '/funding/wotc', isSectionLink: true },
      { name: 'Get Started', isHeader: true },
      { name: 'Check Eligibility', href: '/funding/eligibility', isSectionLink: true },
      { name: 'Funding FAQs', href: '/funding/faq', isSectionLink: true },
      { name: 'Speak With an Advisor', href: '/contact', isSectionLink: true },
    ],
  },
  // ── 6. Partners — Employers / Workforce / Training / Beauty ───────────────
  {
    id: 'partners',
    name: 'Partners',
    subItems: [
      { name: 'Employers', isHeader: true },
      { name: 'Hire Graduates', href: '/employers/hire', isSectionLink: true },
      { name: 'Post a Job', href: '/employers/post-job', isSectionLink: true },
      { name: 'Sponsor an Apprentice', href: '/employers/sponsor', isSectionLink: true },
      { name: 'Employer Training', href: '/employers/training', isSectionLink: true },
      { name: 'Employer Portal', href: '/portal/employer', isSectionLink: true, isAuth: true },
      { name: 'Workforce Agencies', isHeader: true },
      { name: 'Refer a Participant', href: '/workforce-agencies/refer', isSectionLink: true },
      { name: 'Workforce Board Services', href: '/workforce-agencies/board-services', isSectionLink: true },
      { name: 'WIOA Partnerships', href: '/workforce-agencies/wioa', isSectionLink: true },
      { name: 'Agency Portal', href: '/portal/agency', isSectionLink: true, isAuth: true },
      { name: 'Training Partners', isHeader: true },
      { name: 'Program Holder Services', href: '/partners/program-holders', isSectionLink: true },
      { name: 'Training Providers', href: '/partners/training-providers', isSectionLink: true },
      { name: 'Referral Partners', href: '/partners/referral', isSectionLink: true },
      { name: 'Sponsors and Funders', href: '/partners/sponsors', isSectionLink: true },
      { name: 'Beauty Partners', isHeader: true },
      { name: 'Become a Barber Host Shop', href: '/partners/barber-host', isSectionLink: true },
      { name: 'Become a Cosmetology Host Shop', href: '/partners/cosmetology-host', isSectionLink: true },
      { name: 'Host Shop Portal', href: '/portal/host-shop', isSectionLink: true, isAuth: true },
    ],
  },
  // ── 7. Portals — Learner / Apprenticeship / Partner / Staff ───────────────
  {
    id: 'portals',
    name: 'Portals',
    subItems: [
      { name: 'Learner Access', isHeader: true },
      { name: 'Student Portal', href: '/portal/student', isSectionLink: true, isAuth: true },
      { name: 'LMS', href: '/lms', isSectionLink: true, isAuth: true },
      { name: 'Digital Binder', href: '/portal/binder', isSectionLink: true, isAuth: true },
      { name: 'Application Status', href: '/portal/application', isSectionLink: true, isAuth: true },
      { name: 'Career Services', href: '/portal/career', isSectionLink: true, isAuth: true },
      { name: 'Apprenticeship Access', isHeader: true },
      { name: 'Apprentice Portal', href: '/portal/apprentice', isSectionLink: true, isAuth: true },
      { name: 'Host Shop Portal', href: '/portal/host-shop', isSectionLink: true, isAuth: true },
      { name: 'Mentor Portal', href: '/portal/mentor', isSectionLink: true, isAuth: true },
      { name: 'Employer Portal', href: '/portal/employer', isSectionLink: true, isAuth: true },
      { name: 'Partner Access', isHeader: true },
      { name: 'Workforce Portal', href: '/portal/workforce', isSectionLink: true, isAuth: true },
      { name: 'Program Holder Portal', href: '/portal/program-holder', isSectionLink: true, isAuth: true },
      { name: 'Partner Portal', href: '/portal/partner', isSectionLink: true, isAuth: true },
      { name: 'Testing Portal', href: '/portal/testing', isSectionLink: true, isAuth: true },
      { name: 'Staff Access', isHeader: true },
      { name: 'Instructor Portal', href: '/portal/instructor', isSectionLink: true, isAuth: true },
      { name: 'Staff Portal', href: '/portal/staff', isSectionLink: true, isAuth: true },
      { name: 'Admin Portal', href: '/portal/admin', isSectionLink: true, isAuth: true },
    ],
  },
  // ── 8. About — Organization / Trust & Compliance / Resources / Contact ─────
  {
    id: 'about',
    name: 'About',
    subItems: [
      { name: 'Organization', isHeader: true },
      { name: 'Our Mission', href: '/about', isSectionLink: true },
      { name: 'Leadership', href: '/about/team', isSectionLink: true },
      { name: 'Locations', href: '/about/locations', isSectionLink: true },
      { name: 'Impact', href: '/about/impact', isSectionLink: true },
      { name: 'Success Stories', href: '/success-stories', isSectionLink: true },
      { name: 'Trust & Compliance', isHeader: true },
      { name: 'Approvals', href: '/about/approvals', isSectionLink: true },
      { name: 'Accreditation', href: '/about/accreditation', isSectionLink: true },
      { name: 'Policies', href: '/about/policies', isSectionLink: true },
      { name: 'Nondiscrimination', href: '/about/nondiscrimination', isSectionLink: true },
      { name: 'Accessibility', href: '/about/accessibility', isSectionLink: true },
      { name: 'Resources', isHeader: true },
      { name: 'Blog', href: '/blog', isSectionLink: true },
      { name: 'FAQ', href: '/faq', isSectionLink: true },
      { name: 'Events', href: '/events', isSectionLink: true },
      { name: 'Press', href: '/about/press', isSectionLink: true },
      { name: 'Contact', isHeader: true },
      { name: 'Contact Us', href: '/contact', isSectionLink: true },
      { name: 'Free Advising', href: '/contact/advising', isSectionLink: true },
      { name: 'Schedule Consultation', href: '/contact/consultation', isSectionLink: true },
      { name: 'Donate', href: '/donate', isSectionLink: true },
    ],
  },
  // ── 9. Apply — Students / Apprenticeships / Organizations / Careers ────────
  {
    id: 'apply',
    name: 'Apply',
    subItems: [
      { name: 'Students', isHeader: true },
      { name: 'Check Eligibility', href: '/apply/eligibility', isSectionLink: true },
      { name: 'Apply for Training', href: '/apply', isSectionLink: true },
      { name: 'Track Application', href: '/apply/track', isSectionLink: true },
      { name: 'Application Status', href: '/portal/application', isSectionLink: true, isAuth: true },
      { name: 'Apprenticeships', isHeader: true },
      { name: 'Become an Apprentice', href: '/apprenticeships/apply', isSectionLink: true },
      { name: 'Become a Host Shop', href: '/apprenticeships/host-shop', isSectionLink: true },
      { name: 'Apprenticeship Sponsor', href: '/apprenticeships/sponsor', isSectionLink: true },
      { name: 'Organizations', isHeader: true },
      { name: 'Employer Application', href: '/apply/employer', isSectionLink: true },
      { name: 'Program Holder Application', href: '/apply/program-holder', isSectionLink: true },
      { name: 'Agency / Partner Application', href: '/apply/agency', isSectionLink: true },
      { name: 'Careers', isHeader: true },
      { name: 'Instructor Application', href: '/apply/instructor', isSectionLink: true },
      { name: 'Staff Application', href: '/apply/staff', isSectionLink: true },
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
