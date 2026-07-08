// Single source of truth for the public marketing site navigation.
//
// Rules:
// - Top-level items cover every major audience and content area.
// - Programs mega-menu: all canonical programs, grouped by industry.
// - Apprenticeships: DOL-registered, separate from programs.
// - Partners: employers, agencies, training providers, program holders, booth renters.
// - About: mission, team, impact, blog, contact, advising.
// - Funding: all streams + eligibility CTA.
// - Apply: single funnel entry point.
//
// Consumed by:
//   components/site/Header.tsx → HeaderDesktopNav + HeaderMobileMenu

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
  // ── 1. Programs ─────────────────────────────────────────────────────────────
  {
    id: 'programs',
    name: 'Programs',
    href: '/programs',
    subItems: [
      // Healthcare
      { name: '— Healthcare —', href: '/programs/healthcare', isHeader: true },
      { name: 'CNA / Nursing Assistant', href: '/programs/cna' },
      { name: 'QMA / Medication Aide', href: '/programs/qma' },
      { name: 'Phlebotomy Technician', href: '/programs/phlebotomy' },
      { name: 'Medical Assistant', href: '/programs/medical-assistant' },
      { name: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
      { name: 'Direct Support Professional', href: canonicalRoutes.programs.directSupportProfessional },
      { name: 'Drug & Alcohol Collector', href: '/programs/drug-collector' },
      { name: 'CPR / First Aid', href: '/programs/cpr-first-aid' },
      { name: 'All Healthcare →', href: '/programs/healthcare', isSectionLink: true },

      // Skilled Trades
      { name: '— Skilled Trades —', href: '/programs/skilled-trades', isHeader: true },
      { name: 'HVAC Technician', href: canonicalRoutes.programs.hvacTechnician },
      { name: 'Building Services Technician', href: canonicalRoutes.programs.buildingServicesTechnician },
      { name: 'Electrical', href: '/programs/electrical' },
      { name: 'Plumbing', href: '/programs/plumbing' },
      { name: 'CDL Training', href: '/programs/cdl-training' },
      { name: 'All Trades →', href: '/programs/skilled-trades', isSectionLink: true },

      // Beauty & Cosmetology
      { name: '— Beauty & Cosmetology —', href: '/programs/beauty', isHeader: true },
      { name: 'Barber Apprenticeship', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology Apprenticeship', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Esthetician Apprenticeship', href: canonicalRoutes.programs.estheticianApprenticeship },
      { name: 'Nail Technician Apprenticeship', href: '/programs/nail-technician-apprenticeship' },
      { name: 'All Beauty →', href: '/apprenticeships', isSectionLink: true },

      // Technology
      { name: '— Technology —', href: '/programs/technology', isHeader: true },
      { name: 'IT Help Desk', href: '/programs/it-help-desk' },
      { name: 'Cybersecurity Analyst', href: '/programs/cybersecurity-analyst' },
      { name: 'All Technology →', href: '/programs/technology', isSectionLink: true },

      // Business & Finance
      { name: '— Business & Finance —', href: '/programs/finance-bookkeeping-accounting', isHeader: true },
      { name: 'Finance, Bookkeeping & Accounting', href: '/programs/finance-bookkeeping-accounting' },

      // Short Courses (partner)
      { name: '— Short Courses —', href: '/courses', isHeader: true },
      { name: 'CPR / First Aid (HSI)', href: '/partners/hsi' },
      { name: 'Food Handler (NRF)', href: '/partners/nrf' },
      { name: 'All Short Courses →', href: '/courses', isSectionLink: true },

      // Special Programs
      { name: '— Special Programs —', href: '/programs', isHeader: true },
      { name: 'Federal-Funded Programs', href: '/programs/federal-funded' },
      { name: 'JRI — Justice-Involved', href: '/partners/jri' },
      { name: 'All Programs →', href: '/programs', isSectionLink: true },
    ],
  },

  // ── 2. Apprenticeships ───────────────────────────────────────────────────────
  {
    id: 'apprenticeships',
    name: 'Apprenticeships',
    href: '/apprenticeships',
    subItems: [
      // DOL Registered programs
      { name: '— DOL Registered —', href: '/apprenticeships', isHeader: true },
      { name: 'All Apprenticeships', href: '/apprenticeships' },
      { name: 'Barber Apprenticeship', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology Apprenticeship', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Esthetician Apprenticeship', href: canonicalRoutes.programs.estheticianApprenticeship },
      { name: 'Skilled Trades Apprenticeships', href: '/programs/skilled-trades' },
      // Host a site
      { name: '— Host a Site —', href: '/partners/barber-host-shop', isHeader: true },
      { name: 'Host a Barbershop Apprenticeship', href: '/partners/barber-host-shop' },
      { name: 'Host a Cosmetology Apprenticeship', href: '/partners/cosmetology-host-shop' },
      { name: 'Apprenticeship Sponsorship', href: '/employer/apprenticeships' },
      { name: 'How It Works →', href: '/apprenticeships', isSectionLink: true },
    ],
  },

  // ── 3. Testing ────────────────────────────────────────────────────────────────
  {
    id: 'testing',
    name: 'Testing',
    href: '/testing',
    subItems: [
      { name: '— Certification Exams —', href: '/testing', isHeader: true },
      { name: 'NHA Healthcare Exams', href: '/testing/nha' },
      { name: 'EPA 608 (HVAC)', href: '/testing/esco' },
      { name: 'Certiport (IT / Microsoft)', href: '/testing/certiport' },
      { name: 'ACT WorkKeys', href: '/testing/workkeys' },
      { name: 'All Testing Providers →', href: '/testing', isSectionLink: true },
      { name: '— Schedule & Access —', href: '/testing/book', isHeader: true },
      { name: 'Book a Testing Session', href: '/testing/book' },
      { name: 'Testing Accommodations', href: '/testing/accommodations' },
      { name: 'Verify a Credential', href: '/verify' },
    ],
  },

  // ── 3b. Store ────────────────────────────────────────────────────────────────
  {
    id: 'store',
    name: 'Store',
    href: '/store',
    subItems: [
      { name: '— Platform Licenses —', href: '/store', isHeader: true },
      { name: 'Core Platform', href: '/store' },
      { name: 'School / Training Provider', href: '/store' },
      { name: 'Enterprise Solution', href: '/store' },
      { name: 'View All Plans →', href: '/store', isSectionLink: true },
      { name: '— Digital Products —', href: '/store/guides', isHeader: true },
      { name: 'Capital Readiness Guide', href: '/store/guides/capital-readiness' },
      { name: 'Licensing Guide', href: '/store/guides/licensing' },
      { name: 'All Guides →', href: '/store/guides', isSectionLink: true },
      { name: '— Apps & Add-Ons —', href: '/apps', isHeader: true },
      { name: 'Grants Discovery', href: '/apps/grants' },
      { name: 'SAM.gov Assistant', href: '/apps/sam-gov' },
      { name: 'Website Builder', href: '/apps/website-builder' },
      { name: 'All Apps →', href: '/apps', isSectionLink: true },
    ],
  },

  // ── 4. Funding ──────────────────────────────────────────────────────────────
  {
    id: 'funding',
    name: 'Funding',
    href: '/funding',
    subItems: [
      { name: '— Funding Streams —', href: '/funding', isHeader: true },
      { name: 'WIOA / WorkOne', href: '/eligibility' },
      { name: 'ETPL Approved Provider', href: '/federal-compliance' },
      { name: 'Workforce Ready Grant (WRG)', href: '/funding/wrg' },
      { name: 'FSSA IMPACT (SNAP / TANF)', href: '/fssa' },
      { name: 'Job Ready Indy (JRI)', href: '/partners/jri' },
      { name: 'JRI — Justice-Involved', href: '/partners/reentry' },
      { name: 'Grant Programs', href: '/funding/grant-programs' },
      { name: 'Federal Programs', href: '/funding/federal-programs' },
      { name: '— Compliance & Proof —', href: '/compliance', isHeader: true },
      { name: 'RAPIDS / DOL Apprenticeship', href: '/compliance/apprenticeship-structure' },
      { name: 'Federal Compliance', href: '/federal-compliance' },
      { name: 'Workforce Partnerships', href: '/partners/workforce' },
      { name: '— Payment Options —', href: '/financing', isHeader: true },
      { name: 'Self-Pay & Payment Plans', href: '/financing' },
      { name: 'OJT & Wage Reimbursement', href: '/ojt-and-funding' },
      { name: 'Scholarships', href: '/scholarships' },
      { name: 'Check Eligibility →', href: '/check-eligibility', isSectionLink: true },
    ],
  },

  // ── 5. Partners ─────────────────────────────────────────────────────────────
  {
    id: 'partners',
    name: 'Partners',
    href: '/partners',
    subItems: [
      // Employers
      { name: '— Employers —', href: '/for-employers', isHeader: true },
      { name: 'Hire Our Graduates', href: '/for-employers' },
      { name: 'Employer Directory', href: '/employers/directory' },
      { name: 'Job Board', href: '/jobs' },
      { name: 'Post a Job / OJT', href: '/employer/post-job' },
      { name: 'Apprenticeship Sponsorship', href: '/employer/apprenticeships' },
      { name: 'WOTC Tax Credits', href: '/employer/wotc' },
      { name: 'Employer Portal →', href: '/employer/dashboard', isSectionLink: true },
      // Workforce Agencies
      { name: '— Workforce Agencies —', href: '/for-agencies', isHeader: true },
      { name: 'WIOA / WorkOne Referrals', href: '/for-agencies' },
      { name: 'FSSA / SNAP E&T', href: '/fssa' },
      { name: 'Apprenticeship Sponsor', href: '/apprenticeship-sponsor' },
      { name: 'Workforce Boards', href: '/platform/workforce-boards' },
      // Referral Partners
      { name: '— Referral Partners —', href: '/partners/referral', isHeader: true },
      { name: 'Referral Partner Program', href: '/partners/referral' },
      { name: 'Submit a Referral', href: '/apply/intake' },
      // Beauty Apprenticeship Partnerships
      { name: '— Beauty Partnerships —', href: '/partners/barber-host-shop', isHeader: true },
      { name: 'Barbershop Partnership', href: '/partners/barber-host-shop' },
      { name: 'Cosmetology Partnership', href: '/partners/cosmetology-host-shop' },
      // Training Providers & Program Holders
      { name: '— Program Holders & Providers —', href: '/for-providers', isHeader: true },
      { name: 'How It Works', href: '/for-providers' },
      { name: 'Program Holder Portal', href: '/program-holder/dashboard' },
      { name: 'Sponsors & Funders', href: '/platform/sponsors' },
      { name: 'All Partner Applications →', href: '/apply', isSectionLink: true },
    ],
  },

  // ── 5b. Portals (sign-in + workforce tools) ─────────────────────────────────
  {
    id: 'portals',
    name: 'Portals',
    href: '/portals',
    subItems: [
      { name: '— Sign In —', href: '/portals', isHeader: true },
      { name: 'Portal Hub', href: '/portals' },
      { name: 'Student / Learner', href: '/login?redirect=/learner/dashboard' },
      { name: 'Employer Portal', href: '/login?redirect=/employer/dashboard' },
      { name: 'Staff Portal', href: '/login?redirect=/admin/staff-portal/dashboard' },
      { name: 'Instructor Portal', href: '/login?redirect=/instructor/dashboard' },
      { name: 'Partner Portal', href: '/login?redirect=/partner/dashboard' },
      { name: 'Program Holder', href: '/login?redirect=/program-holder/dashboard' },
      { name: '— Workforce Tools —', href: '/career-services', isHeader: true },
      { name: 'Career Services', href: '/career-services' },
      { name: 'Employment Support', href: '/employment-support' },
      { name: 'Job Board', href: '/jobs' },
      { name: 'How It Works', href: '/how-it-works' },
    ],
  },

  // ── 6. About ────────────────────────────────────────────────────────────────
  {
    id: 'about',
    name: 'About',
    href: '/about',
    subItems: [
      { name: '— Organization —', href: '/about', isHeader: true },
      { name: 'Our Mission', href: '/about/mission' },
      { name: 'Our Team', href: '/about/team' },
      { name: 'Our Partners', href: '/about/partners' },
      { name: 'Impact & Outcomes', href: '/impact' },
      { name: 'Live Metrics', href: '/metrics' },
      { name: 'Accreditation', href: '/accreditation' },
      { name: '— Resources —', href: '/blog', isHeader: true },
      { name: 'Blog', href: '/blog' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Events', href: '/events' },
      { name: 'Success Stories', href: '/success-stories' },
      { name: 'Press', href: '/press' },
      { name: '— Contact —', href: '/contact', isHeader: true },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Free Advising', href: '/advising' },
      { name: 'Schedule a Consultation', href: '/schedule-consultation' },
      { name: 'Donate', href: '/donate' },
    ],
  },

  // ── 7. Applications — full application funnel by audience ────────────────────
  {
    id: 'apply',
    name: 'Applications',
    href: '/apply',
    subItems: [
      // Students / Participants
      { name: '— Students & Participants —', href: '/apply', isHeader: true },
      { name: 'Check Eligibility & Apply', href: '/apply' },
      { name: 'Student Application', href: '/apply/student' },
      { name: 'FSSA / SNAP E&T Application', href: '/apply/fssa' },
      { name: 'Enroll in a Program', href: '/enrollment' },
      { name: 'Track My Application', href: '/apply/track' },
      { name: 'Check Application Status', href: '/apply/status' },

      // Employers
      { name: '— Employers —', href: '/apply/employer', isHeader: true },
      { name: 'Employer Application', href: '/apply/employer' },
      { name: 'Employer Directory', href: '/employers/directory' },
      { name: 'Job Board', href: '/jobs' },
      { name: 'Post a Job / OJT', href: '/employer/post-job' },
      { name: 'Apprenticeship Sponsorship', href: '/employer/apprenticeships' },
      { name: 'Employer Onboarding →', href: '/onboarding/employer', isSectionLink: true },

      // Training Providers & Program Holders
      { name: '— Program Holders & Providers —', href: '/apply/program-holder', isHeader: true },
      { name: 'Program Holder Application', href: '/apply/program-holder' },
      { name: 'Barbershop Apprenticeship Host', href: '/partners/barber-host-shop/apply' },
      { name: 'Cosmetology Partner Shop', href: '/partners/cosmetology-host-shop/apply' },
      { name: 'Booth Rental Application', href: '/booth-rental/apply' },
      { name: 'Create a Program', href: '/partners/create-program' },

      // Staff & Instructors
      { name: '— Staff & Instructors —', href: '/apply/staff', isHeader: true },
      { name: 'Staff Application', href: '/apply/staff' },
      { name: 'Instructor Application', href: '/onboarding/instructor' },
      { name: 'Instructor Credentials', href: 'https://admin.elevateforhumanity.org/admin/instructor-credentials' },

      // Agencies & Partners
      { name: '— Agencies & Partners —', href: '/partners/apply', isHeader: true },
      { name: 'Agency / Partner Application', href: '/partners/apply' },
      { name: 'Apprenticeship Sponsor', href: '/apprenticeship-sponsor' },
      { name: 'All Applications →', href: '/apply', isSectionLink: true },
    ],
  },
];
