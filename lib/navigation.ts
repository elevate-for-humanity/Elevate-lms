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
    id: 'platform-os',
    name: 'Platform',
    href: '/platform/overview',
    subItems: [
      { name: '— The Workforce OS —', href: '/platform/overview', isHeader: true },
      { name: 'Platform Overview', href: '/platform/overview' },
      { name: 'AI Career Navigator', href: '/ai' },
      { name: 'Apprenticeship Technology', href: '/apprenticeships' },
      { name: 'Compliance Automation', href: '/store/add-ons/compliance-automation' },
      { name: 'Blockchain Credentials', href: '/platform/verification' },
      { name: 'Analytics & Reporting', href: '/platform/workforce-analytics' },
    ],
  },
  {
    id: 'testing',
    name: 'Testing',
    href: '/testing',
    subItems: [
      { name: '— Credential Exams —', href: '/testing', isHeader: true },
      { name: 'Testing Center overview', href: '/testing' },
      { name: 'Schedule an exam', href: '/testing/book' },
      { name: 'All exams & certifications →', href: '/testing', isSectionLink: true },
    ],
  },
  {
    id: 'partner-solutions',
    name: 'Solutions',
    href: '/partners',
    subItems: [
      { name: '— Ecosystem Solutions —', href: '/partners', isHeader: true },
      { name: 'Employer Solutions', href: '/for-employers' },
      { name: 'Workforce Agencies', href: '/for-agencies' },
      { name: 'Government Partners', href: '/government' },
      { name: 'Training Providers', href: '/for-providers' },
      { name: 'Host Shop Network', href: '/partners/barber-host-shop' },
    ],
  },
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
      { name: 'Pharmacy Technician', href: '/programs/pharmacy-technician' },
      { name: 'Home Health Aide', href: '/programs/home-health-aide' },
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
      { name: 'Welding', href: '/programs/welding' },
      { name: 'CDL Training', href: '/programs/cdl-training' },
      { name: 'Diesel Mechanic', href: '/programs/diesel-mechanic' },
      { name: 'Construction Trades', href: '/programs/construction-trades-certification' },
      { name: 'All Trades →', href: '/programs/skilled-trades', isSectionLink: true },

      { name: '— Beauty & Apprenticeships —', href: '/programs#cat-beauty', isHeader: true },
      { name: 'All beauty programs →', href: '/programs#cat-beauty', isSectionLink: true },
      { name: 'Barber Apprenticeship · $4,980', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology Apprenticeship', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Esthetician Apprenticeship', href: canonicalRoutes.programs.estheticianApprenticeship },
      { name: 'Nail Technician Apprenticeship', href: '/programs/nail-technician-apprenticeship' },
      { name: 'Beauty & Career Educator', href: '/programs/beauty-career-educator' },

      { name: '— Barber host shops —', href: '/programs/barber-apprenticeship/host-shops', isHeader: true },
      { name: 'Find a barber host shop', href: '/programs/barber-apprenticeship/host-shops' },
      { name: 'Enroll your barbershop', href: '/partners/barber-host-shop' },
      { name: 'Barber Host Portal', href: '/host-shop/dashboard' },

      { name: '— Cosmetology host shops —', href: '/programs/cosmetology-apprenticeship/host-shops', isHeader: true },
      { name: 'Find a cosmetology host shop', href: '/programs/cosmetology-apprenticeship/host-shops' },
      { name: 'Enroll your salon', href: '/partners/cosmetology-host-shop' },
      { name: 'Cosmetology Host Portal', href: '/cosmetology-host-shop/dashboard' },

      { name: '— Esthetician host shops —', href: '/programs/esthetician-apprenticeship/host-shops', isHeader: true },
      { name: 'Find an esthetician host shop', href: '/programs/esthetician-apprenticeship/host-shops' },
      { name: 'Enroll your esthetician spa', href: '/partners/esthetician-host-shop' },

      { name: '— Nail technician host shops —', href: '/programs/nail-technician-apprenticeship/host-shops', isHeader: true },
      { name: 'Find a nail host shop', href: '/programs/nail-technician-apprenticeship/host-shops' },
      { name: 'Enroll your nail salon', href: '/partners/nail-host-shop' },

      { name: '— Technology —', href: '/programs/technology', isHeader: true },
      { name: 'IT Help Desk', href: '/programs/it-help-desk' },
      { name: 'Cybersecurity Analyst', href: '/programs/cybersecurity-analyst' },
      { name: 'Software Development', href: '/programs/software-development' },
      { name: 'Web Development', href: '/programs/web-development' },
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
    
      { name: '— More Programs & Previews —', href: '/programs/micro-programs', isHeader: true },
      { name: 'HVAC Technician', href: '/programs/hvac-technician' },
      { name: 'Barber Studio', href: '/programs/barber-apprenticeship' },
      { name: 'Business Program', href: '/programs/business' },
      { name: 'Esthetician Orientation', href: '/programs/esthetician-apprenticeship/orientation' },
      { name: 'Curriculum', href: '/programs/hvac-technician/curriculum' },
      { name: 'Study Guide', href: '/programs/hvac-technician/study-guide' },
      { name: 'Micro-Programs', href: '/programs/micro-programs' },
      { name: 'Mesmerized by Beauty', href: '/schools/mesmerized-by-beauty' },
    ],
  },

  {
    id: 'apprenticeships',
    name: 'Apprenticeships',
    href: '/apprenticeships',
    subItems: [
      { name: '— Registered programs —', href: '/apprenticeships', isHeader: true },
      { name: 'Overview & how it works', href: '/apprenticeships' },
      { name: 'Barber Apprenticeship · $4,980', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology Apprenticeship', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Esthetician Apprenticeship', href: canonicalRoutes.programs.estheticianApprenticeship },
      { name: 'Nail Technician Apprenticeship', href: '/programs/nail-technician-apprenticeship' },
      { name: 'Culinary Apprenticeship', href: '/programs/culinary-apprenticeship' },
      { name: 'Host shop inquiry', href: '/forms/host-shop-inquiry' },
      { name: 'Become an apprenticeship sponsor →', href: '/apprentice/sponsor', isSectionLink: true },
    ],
  },

  {
    id: 'testing',
    name: 'Testing',
    href: '/testing',
    subItems: [
      { name: '— Credential Exams —', href: '/testing', isHeader: true },
      { name: 'Testing Center overview', href: '/testing' },
      { name: 'Certiport (MOS, IC3)', href: '/testing/certiport' },
      { name: 'ACT WorkKeys / NCRC', href: '/testing/workkeys' },
      { name: 'EPA 608 Universal', href: '/testing/epa608' },
      { name: 'NHA Certifications', href: '/testing/nha' },
      { name: 'NRF Rise Up', href: '/testing/riseup' },
      { name: 'ServSafe / Food Safety', href: '/testing/servsafe' },
      { name: 'HSI CPR / First Aid', href: '/testing/hsi' },
      { name: 'OSHA 10 / 30', href: '/testing/osha' },
      { name: 'All exams & certifications →', href: '/testing', isSectionLink: true },
      
      { name: '— Exam info —', href: '/credentials', isHeader: true },
      { name: 'Credentials & certifications', href: '/credentials' },
      { name: 'Schedule an exam', href: '/testing/book' },
      { name: 'Testing policies', href: '/testing#policies' },
      { name: 'Testing accommodations', href: '/testing/accommodations' },
      
      { name: '— For employers —', href: '/testing/for-employers', isHeader: true },
      { name: 'Bulk testing for employers', href: '/testing/for-employers' },
      { name: 'Workforce assessments', href: '/testing/assessments' },
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
    
      { name: '— Funding & Eligibility —', href: '/find-workone', isHeader: true },
      { name: 'Find Workone', href: '/find-workone' },
      { name: 'FSSA', href: '/fssa' },
      { name: 'Tpp Survey', href: '/fssa/tpp-survey' },
      { name: 'DOL', href: '/funding/dol' },
      { name: 'How It Works', href: '/funding/how-it-works' },
      { name: 'Job Ready Indy', href: '/funding/job-ready-indy' },
      { name: 'Funding — JRI', href: '/funding/jri' },
      { name: 'Grants', href: '/grants' },
      { name: 'JRI', href: '/jri' },
      { name: 'Programs — JRI', href: '/programs/jri' },
      { name: 'SNAP Et', href: '/snap/snap-et' },
      { name: 'WIOA Eligibility', href: '/wioa-eligibility' },
      { name: 'Low Income', href: '/wioa-eligibility/low-income' },
      { name: 'Public Assistance', href: '/wioa-eligibility/public-assistance' },
      { name: 'Veterans', href: '/wioa-eligibility/veterans' },
      { name: 'WIOA Participant', href: '/wioa-participant' },
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
    
      { name: '— Workforce Partners —', href: '/mou/employer', isHeader: true },
      { name: 'MOU — Employer', href: '/mou/employer' },
      { name: 'Suboffice Onboarding', href: '/suboffice-onboarding' },
      { name: 'Workforce Board', href: '/workforce-board' },
      { name: 'Employment', href: '/workforce-board/employment' },
      { name: 'Workforce Partners', href: '/workforce-partners' },
      { name: 'Workone Partner Packet', href: '/workone-partner-packet' },
      { name: 'For Partners', href: '/for-partners' },
      { name: 'Hire Graduates', href: '/hire-graduates' },
      { name: '— Platform & Licensing —', href: '/license', isHeader: true },
      { name: 'License', href: '/license' },
      { name: 'License — Features', href: '/license/features' },
      { name: 'License — Integrations', href: '/license/integrations' },
      { name: 'License — Pricing', href: '/license/pricing' },
      { name: 'Licenses', href: '/licenses' },
      { name: 'Enterprise Review', href: '/licenses/enterprise-review' },
      { name: 'Licenses — Purchase', href: '/licenses/purchase' },
      { name: 'Licenses — Request', href: '/licenses/request' },
      { name: 'Licensing', href: '/licensing' },
      { name: 'Mobile', href: '/mobile' },
      { name: 'Mobile App', href: '/mobile-app' },
      { name: 'Platform — Overview', href: '/platform/overview' },
      { name: 'Partner Portal', href: '/platform/partner-portal' },
      { name: 'Training Providers', href: '/platform/training-providers' },
      { name: 'Workforce Analytics', href: '/platform/workforce-analytics' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Sponsor Licensing', href: '/pricing/sponsor-licensing' },
      { name: 'Solutions', href: '/solutions' },
      { name: 'Distance Learning', href: '/solutions/distance-learning' },
      { name: 'Higher Ed', href: '/solutions/higher-ed' },
      { name: 'K-12', href: '/solutions/k12' },
      { name: 'White Label', href: '/white-label' },
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
    
      { name: '— Store, Apps & Add-ons —', href: '/shop', isHeader: true },
      { name: 'Shop', href: '/shop' },
      { name: 'Products', href: '/shop/products' },
      { name: 'Add Ons', href: '/store/add-ons' },
      { name: 'Agency Template Autofill', href: '/store/add-ons/agency-template-autofill' },
      { name: 'Analytics Pro', href: '/store/add-ons/analytics-pro' },
      { name: 'Community Hub', href: '/store/add-ons/community-hub' },
      { name: 'Compliance Automation', href: '/store/add-ons/compliance-automation' },
      { name: 'Compliance Signature Automation', href: '/store/add-ons/compliance-signature-automation' },
      { name: 'Grant Contract Suite', href: '/store/add-ons/grant-contract-suite' },
      { name: 'Proposal Writing Assistant', href: '/store/add-ons/proposal-writing-assistant' },
      { name: 'Workforce Grant Operations Hub', href: '/store/add-ons/workforce-grant-operations-hub' },
      { name: 'AI Studio', href: '/store/ai-studio' },
      { name: 'AI Team', href: '/store/ai-team' },
      { name: 'Store — Apps', href: '/store/apps' },
      { name: 'Apps — Grants', href: '/store/apps/grants' },
      { name: 'SAM.gov Gov', href: '/store/apps/sam-gov' },
      { name: 'Website Builder', href: '/store/apps/website-builder' },
      { name: 'Beauty Programs', href: '/store/beauty-programs' },
      { name: 'Store — Compliance', href: '/store/compliance' },
      { name: 'Compliance — FERPA', href: '/store/compliance/ferpa' },
      { name: 'Grant Reporting', href: '/store/compliance/grant-reporting' },
      { name: 'Compliance — WCAG', href: '/store/compliance/wcag' },
      { name: 'Compliance — WIOA', href: '/store/compliance/wioa' },
      { name: 'Store — Courses', href: '/store/courses' },
      { name: 'HVAC Technician Course License', href: '/store/courses/hvac-technician-course-license' },
      { name: 'Demo — Admin', href: '/store/demo/admin' },
      { name: 'Demo — Employer', href: '/store/demo/employer' },
      { name: 'Demo — Enterprise', href: '/store/demo/enterprise' },
      { name: 'Demo — Institutional', href: '/store/demo/institutional' },
      { name: 'Demo — Instructor', href: '/store/demo/instructor' },
      { name: 'Demo — Student', href: '/store/demo/student' },
      { name: 'Store — Demos', href: '/store/demos' },
      { name: 'Store — Deployment', href: '/store/deployment' },
      { name: 'Store — Digital', href: '/store/digital' },
      { name: 'Capital Readiness', href: '/store/guides/capital-readiness' },
      { name: 'Capital Readiness — Enterprise', href: '/store/guides/capital-readiness/enterprise' },
      { name: 'Capital Readiness — Slides', href: '/store/guides/capital-readiness/slides' },
      { name: 'Licensing', href: '/store/guides/licensing' },
      { name: 'Store — Integrations', href: '/store/integrations' },
      { name: 'Licenses', href: '/store/licenses' },
      { name: 'Enterprise License', href: '/store/licenses/enterprise-license' },
      { name: 'Managed Platform', href: '/store/licenses/managed-platform' },
      { name: 'Pro License', href: '/store/licenses/pro-license' },
      { name: 'School License', href: '/store/licenses/school-license' },
      { name: 'Source Use', href: '/store/licenses/source-use' },
      { name: 'Starter License', href: '/store/licenses/starter-license' },
      { name: 'Starter License — Trial', href: '/store/licenses/starter-license/trial' },
      { name: 'Store — Plans', href: '/store/plans' },
      { name: 'SAM.gov Gov Assistant', href: '/store/sam-gov-assistant' },
      { name: 'Store — Trial', href: '/store/trial' },
      { name: 'White Label', href: '/store/white-label' },
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
      { name: 'All Portals', href: '/portals' },
      { name: 'Student / learner', href: '/login?redirect=/learner/dashboard' },
      { name: 'Apprentice', href: '/login/apprentice' },
      { name: 'Employer', href: '/login?redirect=/employer/dashboard' },
      {
        name: 'Instructor',
        href: '/login?redirect=https%3A%2F%2F%2Fadmin%2Finstructor%2Fdashboard',
      },
      { name: 'Partner / Program Holder', href: '/login?redirect=/program-holder/dashboard' },
      { name: 'Admin Dashboard', href: '/admin/dashboard' },
      { name: 'Case manager', href: '/login?redirect=/case-manager/dashboard' },
      { name: 'Mentor', href: '/login?redirect=/mentor/dashboard' },
      {
        name: 'Staff',
        href: '/login?redirect=https%3A%2F%2F%2Fadmin%2Fstaff-portal%2Fdashboard',
      },
      { name: 'Program catalog', href: '/programs/catalog' },
    ],
  },

  {
    id: 'support',
    name: 'Support',
    href: '/support',
    subItems: [
      { name: '— Get help —', href: '/support', isHeader: true },
      { name: 'Support hub', href: '/support' },
      { name: 'Live chat', href: '/support/chat' },
      { name: 'Submit a ticket', href: '/support/ticket' },
      { name: 'Contact support', href: '/support/contact' },

      { name: '— Knowledge base —', href: '/support/help', isHeader: true },
      { name: 'Help center (articles)', href: '/support/help' },
      { name: 'Help & resources', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Getting started', href: '/help/getting-started' },
      { name: 'Account help', href: '/help/account' },
      { name: 'Courses & LMS help', href: '/help/courses' },
      { name: 'Technical help', href: '/help/technical' },
      { name: 'Video tutorials', href: '/help/tutorials' },

      { name: '— Student services —', href: '/student-support', isHeader: true },
      { name: 'Student support overview', href: '/student-support' },
      { name: 'Schedule advising', href: '/student-support/schedule' },
      { name: 'Free advising', href: '/advising' },
      { name: 'Career services', href: '/career-services' },
      { name: 'Employment support', href: '/employment-support' },
      { name: 'How it works', href: '/how-it-works' },
    
      { name: '— Careers & Learning —', href: '/academic-calendar', isHeader: true },
      { name: 'Academic Calendar', href: '/academic-calendar' },
      { name: 'Alumni', href: '/alumni' },
      { name: 'Attendance Policy', href: '/attendance-policy' },
      { name: 'Career Assessment', href: '/career-assessment' },
      { name: 'Career Counseling', href: '/career-counseling' },
      { name: 'Career Services — Career Counseling', href: '/career-services/career-counseling' },
      { name: 'Career Services — Contact', href: '/career-services/contact' },
      { name: 'Career Services — Courses', href: '/career-services/courses' },
      { name: 'Interview Prep', href: '/career-services/interview-prep' },
      { name: 'Job Placement', href: '/career-services/job-placement' },
      { name: 'Resume Building', href: '/career-services/resume-building' },
      { name: 'Career Training', href: '/career-training' },
      { name: 'Assessment', href: '/careers/assessment' },
      { name: 'CNA Waitlist', href: '/cna-waitlist' },
      { name: 'Instructional Framework', href: '/instructional-framework' },
      { name: 'Learning Hub', href: '/learning' },
      { name: 'Orientation', href: '/orientation' },
      { name: 'Pathways', href: '/pathways' },
      { name: 'Pathways — Outcomes', href: '/pathways/outcomes' },
      { name: 'Training Model', href: '/pathways/training-model' },
      { name: 'Satisfactory Academic Progress', href: '/satisfactory-academic-progress' },
      { name: 'Syllabi', href: '/syllabi' },
      { name: 'Training Hub', href: '/training' },
      { name: 'Certifications', href: '/training/certifications' },
      { name: 'Learning Center', href: '/training/learning-center' },
      { name: 'Workbooks', href: '/workbooks' },
      { name: 'Writing Center', href: '/writing-center' },
      { name: '— Help & Support —', href: '/directory', isHeader: true },
      { name: 'Site Directory', href: '/directory' },
      { name: 'Documentation', href: '/docs' },
      { name: 'Program Holder Guide', href: '/docs/program-holder-guide' },
      { name: 'Quickstart', href: '/docs/quickstart' },
      { name: 'Forms Library', href: '/forms' },
      { name: 'Barber Apprenticeship Inquiry', href: '/forms/barber-apprenticeship-inquiry' },
      { name: 'Help Center', href: '/help' },
      { name: 'Account', href: '/help/account' },
      { name: 'Help — Courses', href: '/help/courses' },
      { name: 'Getting Started', href: '/help/getting-started' },
      { name: 'Technical', href: '/help/technical' },
      { name: 'Tutorials', href: '/help/tutorials' },
      { name: 'Locations & Sites', href: '/locations' },
      { name: 'Student Support', href: '/student-support' },
      { name: 'Chat', href: '/support/chat' },
      { name: 'Support — Contact', href: '/support/contact' },
      { name: 'Support — Help', href: '/support/help' },
      { name: 'Ticket', href: '/support/ticket' },
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
      { name: 'Events', href: '/events' },
      { name: 'Success stories', href: '/success-stories' },
      { name: 'Press', href: '/press' },

      { name: '— Contact —', href: '/contact', isHeader: true },
      { name: 'Contact us', href: '/contact' },
      { name: 'Schedule consultation', href: '/schedule-consultation' },
      { name: 'Donate', href: '/donate' },
    
      { name: '— Company & News —', href: '/agencies', isHeader: true },
      { name: 'Agencies', href: '/agencies' },
      { name: 'Community Services', href: '/community-services' },
      { name: 'Education', href: '/education' },
      { name: 'Educator Hub', href: '/educatorhub' },
      { name: 'For Students', href: '/for-students' },
      { name: 'Founder', href: '/founder' },
      { name: 'Government', href: '/government' },
      { name: 'Impact Methodology', href: '/impact/methodology' },
      { name: 'Newsroom', href: '/news' },
      { name: 'Program Outcomes', href: '/outcomes' },
      { name: 'For Students (Hub)', href: '/students' },
      { name: 'Team', href: '/team' },
      { name: 'Transparency', href: '/transparency' },
      { name: 'News & Updates', href: '/updates' },
      { name: 'Program Calendar', href: '/updates/2026/01/program-calendar' },
      { name: 'Volunteer', href: '/volunteer' },
      { name: '— AI Tools —', href: '/ai', isHeader: true },
      { name: 'AI Assistant', href: '/ai' },
      { name: 'AI Chat', href: '/ai-chat' },
      { name: 'AI Tutor', href: '/ai-tutor' },
      { name: 'AI — Instructor', href: '/ai/instructor' },
      { name: 'Job Match', href: '/ai/job-match' },
      { name: '— More —', href: '/resources', isHeader: true },
      { name: 'Monthly Giving', href: '/donate/monthly' },
      { name: 'Industries', href: '/industries' },
      { name: 'General Inquiry', href: '/inquiry' },
      { name: 'Reels', href: '/reels' },
      { name: 'Resources', href: '/resources' },
      { name: 'Instructor Training', href: '/resources/instructor-training' },
      { name: 'Services', href: '/services' },
      { name: 'Testimonials', href: '/testimonials' },
      { name: 'Tuition', href: '/tuition' },
      { name: 'Videos', href: '/videos' },
      { name: 'Webinars', href: '/webinars' },
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

/** Split flat subItems into category columns at each `isHeader` boundary (desktop + mobile nav). */
export function groupNavSubItemsByHeader(subItems: NavSubItem[]): NavSubItem[][] {
  const columns: NavSubItem[][] = [];
  let current: NavSubItem[] = [];
  for (const sub of subItems) {
    if (sub.isHeader && current.length > 0) {
      columns.push(current);
      current = [sub];
    } else {
      current.push(sub);
    }
  }
  if (current.length > 0) columns.push(current);
  return columns;
}

export function getNavCategoryLabel(column: NavSubItem[]): string {
  const header = column.find((sub) => sub.isHeader);
  if (header) return header.name.replace(/—/g, '').trim();
  return 'Links';
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
