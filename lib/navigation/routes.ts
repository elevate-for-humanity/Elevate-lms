/**
 * Canonical Route Constants — single source of truth for navigation.
 *
 * Marketing routes remain relative to www.elevateforhumanity.org when they are
 * public pages. Authenticated portal routes are always absolute and use the
 * service ownership defined in lib/routing/portal-map.ts.
 */

import { ADMIN_HOST, LMS_HOST, MARKETING_HOST } from '@/lib/routing/portal-map';

export const ROUTES = {
  // Home / intake
  home: '/',
  apply: '/apply/student',

  // Authentication / portals
  login: `${LMS_HOST}/login`,
  studentPortal: `${LMS_HOST}/lms/dashboard`,
  lmsPortal: `${LMS_HOST}/lms/dashboard`,
  employerPortal: `${LMS_HOST}/employer/dashboard`,
  apprenticePortal: `${LMS_HOST}/apprentice`,
  parentPortal: `${LMS_HOST}/parent-portal/dashboard`,
  workforcePortal: `${LMS_HOST}/workforce/dashboard`,
  hostShopPortal: `${LMS_HOST}/host-shop/dashboard`,
  programHolderPortal: `${LMS_HOST}/program-holder/dashboard`,
  creatorPortal: `${LMS_HOST}/creator/products`,
  // Compatibility aliases retained for old bookmarks; do not expose as separate navigation items.
  cosmetologyHostShopPortal: `${LMS_HOST}/host-shop/dashboard`,
  partnerPortal: `${LMS_HOST}/host-shop/dashboard`,
  adminPortal: `${ADMIN_HOST}/dashboard`,
  instructorPortal: `${ADMIN_HOST}/instructor/dashboard`,
  staffPortal: `${ADMIN_HOST}/staff-portal/dashboard`,
  testingPortal: `${ADMIN_HOST}/testing-center`,
  adminLogin: `${ADMIN_HOST}/login`,
  // These operational workspaces still live on the Marketing service. Keep
  // their URLs absolute so shared navigation never resolves them against the
  // LMS or Admin hostname. Program Holder has already moved to LMS above.
  caseManagerPortal: `${MARKETING_HOST}/case-manager/dashboard`,
  providerPortal: `${MARKETING_HOST}/provider/dashboard`,
  workforceBoardPortal: `${MARKETING_HOST}/workforce-board/dashboard`,

  // Programs
  programs: '/programs',
  programsHealthcare: '/programs/healthcare',
  programsCNA: '/programs/cna',
  programsQMA: '/programs/qma',
  programsMedicalAssistant: '/programs/medical-assistant',
  programsPhlebotomy: '/programs/phlebotomy',
  programsHVAC: '/programs/hvac-technician',
  programsCDL: '/programs/cdl-training',
  programsBeauty: '/barber-and-beauty-apprenticeships',
  programsBarber: '/programs/barber-apprenticeship',
  programsCosmetology: '/programs/cosmetology-apprenticeship',
  programsEsthetician: '/programs/esthetician-apprenticeship',
  programsNailTech: '/programs/nail-technician-apprenticeship',
  programsIT: '/programs/technology',
  programsTechnology: '/programs/technology',

  // Apprenticeships / host sites
  apprenticeships: '/apprenticeships',
  apprenticeshipsHowItWorks: '/how-it-works',
  apprenticeshipsHostShop: '/partners/host-shops',
  apprenticeshipSponsor: '/apprenticeship-sponsor',

  // Funding
  funding: '/funding',
  fundingWIOA: '/funding/wioa',
  fundingJobReadyIndy: '/jri',
  fundingVocRehab: '/funding/state-programs',
  scholarships: '/scholarships',
  eligibility: '/check-eligibility',

  // Employers
  employers: '/employers',
  employersHireGraduates: '/hire-graduates',
  employersPostJob: `${LMS_HOST}/employer/dashboard`,
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
