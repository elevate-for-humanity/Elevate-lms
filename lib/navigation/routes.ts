/**
 * Canonical Route Constants — single source of truth for navigation.
 *
 * Marketing routes remain relative to www.elevateforhumanity.org.
 * Authenticated portal routes use the deployed app/admin origins so navigation
 * remains correct when Marketing, LMS, and Admin run as separate Northflank
 * services.
 */

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.elevateforhumanity.org').replace(/\/$/, '');
const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.elevateforhumanity.org').replace(/\/$/, '');

export const ROUTES = {
  // Home / intake
  home: '/',
  apply: '/apply',

  // Authentication / portals
  login: `${APP_URL}/login`,
  studentPortal: `${APP_URL}/learner/dashboard`,
  lmsPortal: `${APP_URL}/lms/dashboard`,
  employerPortal: `${APP_URL}/employer/dashboard`,
  apprenticePortal: `${APP_URL}/apprentice`,
  parentPortal: `${APP_URL}/parent-portal/dashboard`,
  workforcePortal: `${APP_URL}/workforce/dashboard`,
  hostShopPortal: `${APP_URL}/host-shop/dashboard`,
  cosmetologyHostShopPortal: `${APP_URL}/cosmetology-host-shop/dashboard`,
  partnerPortal: `${APP_URL}/partner/dashboard`,
  adminPortal: `${ADMIN_URL}/admin/dashboard`,
  instructorPortal: `${ADMIN_URL}/admin/instructor/dashboard`,
  staffPortal: `${ADMIN_URL}/admin/staff-portal/dashboard`,
  adminLogin: `${ADMIN_URL}/login`,
  caseManagerPortal: '/case-manager/dashboard',
  providerPortal: '/provider/dashboard',
  programHolderPortal: '/program-holder/dashboard',
  workforceBoardPortal: '/workforce-board/dashboard',

  // Programs
  programs: '/programs',
  programsHealthcare: '/programs/healthcare',
  programsCNA: '/programs/cna',
  programsQMA: '/programs/qma',
  programsMedicalAssistant: '/programs/medical-assistant',
  programsPhlebotomy: '/programs/phlebotomy',
  programsHVAC: '/programs/hvac-technician',
  programsCDL: '/programs/cdl-training',
  programsBeauty: '/programs',
  programsBarber: '/programs/barber-apprenticeship',
  programsCosmetology: '/programs/cosmetology-apprenticeship',
  programsEsthetician: '/programs/esthetician-apprenticeship',
  programsNailTech: '/programs/nail-technician-apprenticeship',
  programsIT: '/programs/it-help-desk',
  programsTechnology: '/programs/technology',

  // Apprenticeships / host shops
  apprenticeships: '/apprenticeships',
  apprenticeshipsHowItWorks: '/how-it-works',
  apprenticeshipsHostShop: '/host-shop',
  apprenticeshipSponsor: '/apprenticeship-sponsor',

  // Funding
  funding: '/funding',
  fundingWIOA: '/funding/wioa',
  fundingJobReadyIndy: '/jri',
  fundingVocRehab: '/funding/state-programs',
  scholarships: '/scholarships',
  eligibility: '/eligibility/quiz',

  // Employers
  employers: '/employer',
  employersHireGraduates: '/hire-graduates',
  employersPostJob: `${APP_URL}/employer/dashboard`,
  forAgencies: '/for-agencies',

  // About
  about: '/about',
  aboutLocations: '/about',
  aboutApprovals: '/approvals',
  successStories: '/success-stories',
  testing: '/testing',
  blog: '/blog',
  faq: '/faq',
  contact: '/contact',

  // Store / Trials
  store: '/store',
  storeDemo: '/store/demo',
} as const;

export type RouteKey = keyof typeof ROUTES;
