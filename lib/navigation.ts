// Single source of truth for public marketing site navigation.
//
// Rules:
// - Each URL appears under ONE top-level section only (no cross-menu duplicates).
// - Top-level = horizontal main menu (tablet/desktop); subItems = dropdown / mobile accordion.
// - Application *forms* live under Apply; employer/partner *pages* under Partners; sign-in under Portals.
//
// Consumed by: components/site/Header.tsx → HeaderMainNav (horizontal + dropdowns on md+, mobile hamburger)

import { canonicalRoutes } from '@/lib/routes/canonical-routes';

export interface NavSubItem {
  name: string;
  href: string;
  isHeader?: boolean;
  isSectionLink?: boolean;
  nested?: boolean;
}

export interface NavItem {
  id: string;
  name: string;
  href?: string;
  subItems?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'programs',
    name: 'Programs',
    href: '/programs',
    subItems: [
      { name: '— Healthcare —', href: '/programs/healthcare', isHeader: true },
      { name: 'CNA / Nursing Assistant', href: '/programs/cna' },
      { name: 'QMA / Medication Aide', href: '/programs/qma' },
      { name: 'Phlebotomy Technician', href: '/programs/phlebotomy' },
      { name: 'Medical Assistant', href: '/programs/medical-assistant' },
      { name: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
      { name: 'Direct Support Professional', href: canonicalRoutes.programs.directSupportProfessional },
      { name: 'Drug & Alcohol Collector', href: '/programs/drug-alcohol-specimen-collector' },
      { name: 'CPR / First Aid', href: '/programs/cpr-first-aid' },
      { name: 'All Healthcare →', href: '/programs/healthcare', isSectionLink: true },

      { name: '— Skilled Trades —', href: '/programs/skilled-trades', isHeader: true },
      { name: 'HVAC Technician', href: canonicalRoutes.programs.hvacTechnician },
      { name: 'Building Services Technician', href: canonicalRoutes.programs.buildingServicesTechnician },
      { name: 'Electrical', href: '/programs/electrical' },
      { name: 'Plumbing', href: '/programs/plumbing' },
      { name: 'CDL Training', href: '/programs/cdl-training' },
      { name: 'All Trades →', href: '/programs/skilled-trades', isSectionLink: true },

      { name: '— Beauty & Apprenticeships —', href: '/programs#cat-beauty', isHeader: true },
      { name: 'Beauty & Cosmetology Hub', href: '/programs#cat-beauty', isSectionLink: true },
      { name: 'Beauty & Career Educator', href: '/programs/beauty-career-educator' },
      { name: 'Registered apprenticeships →', href: '/programs#cat-beauty', isSectionLink: true },

      { name: '— Technology —', href: '/programs/technology', isHeader: true },
      { name: 'IT Help Desk', href: '/programs/it-help-desk' },
      { name: 'Cybersecurity Analyst', href: '/programs/cybersecurity-analyst' },
      { name: 'All Technology →', href: '/programs/technology', isSectionLink: true },

      { name: '— Business & Finance —', href: '/programs/finance-bookkeeping-accounting', isHeader: true },
      { name: 'Finance, Bookkeeping & Accounting', href: '/programs/finance-bookkeeping-accounting' },

      { name: '— Short Courses —', href: '/courses', isHeader: true },
      { name: 'CPR / First Aid (HSI)', href: '/partners/hsi' },
      { name: 'Food Handler (NRF)', href: '/partners/nrf' },
      { name: 'All Short Courses →', href: '/courses', isSectionLink: true },

      { name: '— Special Programs —', href: '/programs', isHeader: true },
      { name: 'Federal-Funded Programs', href: '/programs/federal-funded' },
      { name: 'All Programs →', href: '/programs', isSectionLink: true },
    ],
  },

  {
    id: 'apprenticeships',
    name: 'Apprenticeships',
    href: '/apprenticeships',
    subItems: [
      { name: '— Registered programs —', href: '/apprenticeships', isHeader: true },
      { name: 'Overview & how it works', href: '/apprenticeships' },
      { name: 'Barber Apprenticeship', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology Apprenticeship', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Esthetician Apprenticeship', href: canonicalRoutes.programs.estheticianApprenticeship },
      { name: 'Nail Technician Apprenticeship', href: '/programs/nail-technician-apprenticeship' },

      { name: '— Host shops (by trade) —', href: '/programs/barber-apprenticeship/host-shops', isHeader: true },
      { name: 'Barber host shops', href: '/programs/barber-apprenticeship/host-shops' },
      { name: 'Cosmetology host shops', href: '/programs/cosmetology-apprenticeship/host-shops' },
      { name: 'Esthetician host shops', href: '/programs/esthetician-apprenticeship/host-shops' },
      { name: 'Nail technician host shops', href: '/programs/nail-technician-apprenticeship/host-shops' },
      { name: 'Host shop inquiry', href: '/forms/host-shop-inquiry' },

      { name: '— Enroll your shop —', href: '/partners/barber-host-shop', isHeader: true },
      { name: 'Barbershop partner program', href: '/partners/barber-host-shop' },
      { name: 'Cosmetology partner program', href: '/partners/cosmetology-host-shop' },
      { name: 'Esthetician partner program', href: '/partners/esthetician-apprenticeship' },
      { name: 'Nail technician partner program', href: '/partners/nail-technician-apprenticeship' },
      { name: 'Become an apprenticeship sponsor →', href: '/apprenticeship-sponsor', isSectionLink: true },
    ],
  },

  {
    id: 'testing',
    name: 'Testing',
    href: '/testing',
    subItems: [
      { name: '— Certification exams —', href: '/testing', isHeader: true },
      { name: 'Testing overview', href: '/testing' },
      { name: 'NHA Healthcare Exams', href: '/testing/nha' },
      { name: 'EPA 608 (HVAC)', href: '/testing/esco' },
      { name: 'Certiport (IT / Microsoft)', href: '/testing/certiport' },
      { name: 'ACT WorkKeys', href: '/testing/workkeys' },

      { name: '— Schedule & verify —', href: '/testing/book', isHeader: true },
      { name: 'Book a testing session', href: '/testing/book' },
      { name: 'Testing accommodations', href: '/testing/accommodations' },
      { name: 'Verify a credential', href: '/verify' },
    ],
  },

  {
    id: 'funding',
    name: 'Funding',
    href: '/funding',
    subItems: [
      { name: '— Funding streams —', href: '/funding', isHeader: true },
      { name: 'Funding overview', href: '/funding' },
      { name: 'WIOA / WorkOne eligibility', href: '/eligibility' },
      { name: 'Workforce Ready Grant (WRG)', href: '/funding/wrg' },
      { name: 'Job Ready Indy (JRI)', href: '/partners/jri' },
      { name: 'Justice-involved (reentry)', href: '/partners/reentry' },
      { name: 'Grant programs', href: '/funding/grant-programs' },
      { name: 'Federal programs', href: '/funding/federal-programs' },

      { name: '— Compliance —', href: '/federal-compliance', isHeader: true },
      { name: 'ETPL / federal compliance', href: '/federal-compliance' },
      { name: 'RAPIDS / DOL apprenticeship', href: '/compliance/apprenticeship-structure' },
      { name: 'Workforce partnerships', href: '/partners/workforce' },

      { name: '— Pay for training —', href: '/financing', isHeader: true },
      { name: 'Self-pay & payment plans', href: '/financing' },
      { name: 'OJT & wage reimbursement', href: '/ojt-and-funding' },
      { name: 'Scholarships', href: '/scholarships' },
      { name: 'Check eligibility →', href: '/check-eligibility', isSectionLink: true },
    ],
  },

  {
    id: 'partners',
    name: 'Partners',
    href: '/partners',
    subItems: [
      { name: '— Employers —', href: '/for-employers', isHeader: true },
      { name: 'Hire graduates', href: '/for-employers' },
      { name: 'Employer directory', href: '/employers/directory' },
      { name: 'Job board', href: '/jobs' },
      { name: 'Post a job / OJT', href: '/employer/post-job' },
      { name: 'Apprenticeship sponsorship', href: '/employer/apprenticeships' },
      { name: 'WOTC tax credits', href: '/employer/wotc' },

      { name: '— Workforce agencies —', href: '/for-agencies', isHeader: true },
      { name: 'Agency & WorkOne referrals', href: '/for-agencies' },
      { name: 'Workforce boards', href: '/platform/workforce-boards' },

      { name: '— Training providers —', href: '/for-providers', isHeader: true },
      { name: 'Provider overview', href: '/for-providers' },
      { name: 'Program holder portal', href: '/program-holder/dashboard' },
      { name: 'Sponsors & funders', href: '/platform/sponsors' },

      { name: '— Referrals —', href: '/partners/referral', isHeader: true },
      { name: 'Referral partner program', href: '/partners/referral' },
      { name: 'All partner programs →', href: '/partners', isSectionLink: true },
    ],
  },

  {
    id: 'store',
    name: 'Store',
    href: '/store',
    subItems: [
      { name: '— Platform —', href: '/store', isHeader: true },
      { name: 'LMS & platform plans', href: '/store' },
      { name: 'Digital guides', href: '/store/guides' },
      { name: 'Apps & add-ons', href: '/apps' },
    ],
  },

  {
    id: 'apply',
    name: 'Apply',
    href: '/apply',
    subItems: [
      { name: '— Students —', href: '/apply', isHeader: true },
      { name: 'Apply hub', href: '/apply' },
      { name: 'Student application', href: '/apply/student' },
      { name: 'Enroll in a program', href: '/enrollment' },
      { name: 'Track application', href: '/apply/track' },

      { name: '— Employers —', href: '/apply/employer', isHeader: true },
      { name: 'Employer application', href: '/apply/employer' },
      { name: 'Employer onboarding', href: '/onboarding/employer' },

      { name: '— Providers & hosts —', href: '/apply/program-holder', isHeader: true },
      { name: 'Program holder application', href: '/apply/program-holder' },
      { name: 'Barbershop host application', href: '/partners/barber-host-shop/apply' },
      { name: 'Cosmetology host application', href: '/partners/cosmetology-host-shop/apply' },
      { name: 'Esthetician host shop apply', href: '/partners/esthetician-apprenticeship/apply' },
      { name: 'Nail technician host shop apply', href: '/partners/nail-technician-apprenticeship/apply' },
      { name: 'Booth rental application', href: '/booth-rental/apply' },
      { name: 'Create a program', href: '/partners/create-program' },

      { name: '— Program enrollment applies —', href: '/programs/barber-apprenticeship/apply', isHeader: true },
      { name: 'Barber apprentice apply', href: '/programs/barber-apprenticeship/apply' },
      { name: 'Cosmetology apprentice apply', href: '/programs/cosmetology-apprenticeship/apply' },
      { name: 'HVAC technician apply', href: '/programs/hvac-technician/apply' },
      { name: 'Esthetician apprentice apply', href: '/programs/esthetician-apprenticeship/apply' },
      { name: 'Nail technician apprentice apply', href: '/programs/nail-technician-apprenticeship/apply' },
      { name: 'Peer recovery specialist apply', href: '/programs/peer-recovery-specialist/apply' },
      { name: 'QMA apply', href: '/programs/qma/apply' },

      { name: '— Staff —', href: '/apply/staff', isHeader: true },
      { name: 'Staff application', href: '/apply/staff' },
      { name: 'Instructor onboarding', href: '/onboarding/instructor' },

      { name: '— Agencies —', href: '/partners/apply', isHeader: true },
      { name: 'Agency / partner application', href: '/partners/apply' },
    ],
  },

  {
    id: 'portals',
    name: 'Portals',
    href: '/portals',
    subItems: [
      { name: '— Sign in —', href: '/portals', isHeader: true },
      { name: 'Portal hub', href: '/portals' },
      { name: 'Student / learner', href: '/login?redirect=/learner/dashboard' },
      { name: 'Apprentice', href: '/login/apprentice' },
      { name: 'Employer', href: '/login?redirect=/employer/dashboard' },
      { name: 'Instructor', href: '/login?redirect=/instructor/dashboard' },
      { name: 'Partner', href: '/login?redirect=/partner/dashboard' },
      { name: 'Program holder', href: '/login?redirect=/program-holder/dashboard' },
      { name: 'Case manager', href: '/login?redirect=/case-manager/dashboard' },
      { name: 'Mentor', href: '/login?redirect=/mentor/dashboard' },
      { name: 'Staff', href: '/login?redirect=/admin/staff-portal/dashboard' },
      { name: 'Program catalog', href: '/programs/catalog' },

      { name: '— Career support —', href: '/career-services', isHeader: true },
      { name: 'Career services', href: '/career-services' },
      { name: 'Employment support', href: '/employment-support' },
      { name: 'How it works', href: '/how-it-works' },
    ],
  },

  {
    id: 'about',
    name: 'About',
    href: '/about',
    subItems: [
      { name: '— Organization —', href: '/about', isHeader: true },
      { name: 'About Elevate', href: '/about' },
      { name: 'Our mission', href: '/about/mission' },
      { name: 'Our team', href: '/about/team' },
      { name: 'Our partners', href: '/about/partners' },
      { name: 'Impact & outcomes', href: '/impact' },
      { name: 'Live metrics', href: '/metrics' },
      { name: 'Accreditation', href: '/accreditation' },

      { name: '— Resources —', href: '/blog', isHeader: true },
      { name: 'Blog', href: '/blog' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Events', href: '/events' },
      { name: 'Success stories', href: '/success-stories' },
      { name: 'Press', href: '/press' },

      { name: '— Contact —', href: '/contact', isHeader: true },
      { name: 'Contact us', href: '/contact' },
      { name: 'Free advising', href: '/advising' },
      { name: 'Schedule consultation', href: '/schedule-consultation' },
      { name: 'Donate', href: '/donate' },
    ],
  },
];

/** Collect leaf hrefs for audits (pathname only, no query). */
export function collectNavHrefOwners(items: NavItem[] = NAV_ITEMS): Map<string, string> {
  const owners = new Map<string, string>();
  for (const item of items) {
    if (item.href) {
      const key = item.href.split('?')[0];
      if (!owners.has(key)) owners.set(key, item.name);
    }
    for (const sub of item.subItems ?? []) {
      if (sub.isHeader) continue;
      const key = sub.href.split('?')[0];
      const existing = owners.get(key);
      if (existing && existing !== item.name) {
        owners.set(key, `${existing} + ${item.name}`);
      } else if (!existing) {
        owners.set(key, item.name);
      }
    }
  }
  return owners;
}

export function findDuplicateNavHrefs(items: NavItem[] = NAV_ITEMS): { href: string; owners: string }[] {
  const count = new Map<string, Set<string>>();
  for (const item of items) {
    const add = (href: string) => {
      const key = href.split('?')[0];
      if (!count.has(key)) count.set(key, new Set());
      count.get(key)!.add(item.name);
    };
    if (item.href) add(item.href);
    for (const sub of item.subItems ?? []) {
      if (!sub.isHeader) add(sub.href);
    }
  }
  return [...count.entries()]
    .filter(([, owners]) => owners.size > 1)
    .map(([href, owners]) => ({ href, owners: [...owners].join(', ') }));
}
