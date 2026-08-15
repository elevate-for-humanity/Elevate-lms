/**
 * Canonical Route Constants — single source of truth for navigation.
 *
 * Marketing routes remain relative to www.elevateforhumanity.org when they are
 * public pages. Authenticated portal routes are always absolute and use the
 * service ownership defined in lib/routing/portal-map.ts.
 */

import { ADMIN_HOST, LMS_HOST, MARKETING_HOST } from '@/lib/routing/portal-map';

export const ROUTES = {
  home: '/',
  apply: '/apply/student',

  login: `${LMS_HOST}/login`,
  studentPortal: `${LMS_HOST}/lms/dashboard`,
  lmsPortal: `${LMS_HOST}/lms/dashboard`,
  employerPortal: `${LMS_HOST}/employer/dashboard`,
  apprenticePortal: `${LMS_HOST}/apprentice`,
  parentPortal: `${LMS_HOST}/parent-portal/dashboard`,
  workforcePortal: `${LMS_HOST}/workforce/dashboard`,
  hostShopPortal: `${LMS_HOST}/host-shop/dashboard`,
  programHolderPortal: `${LMS_HOST}/program-holder/dashboard`,
  cosmetologyHostShopPortal: `${LMS_HOST}/host-shop/dashboard`,
  partnerPortal: `${LMS_HOST}/host-shop/dashboard`,
  adminPortal: `${ADMIN_HOST}/dashboard`,
  instructorPortal: `${ADMIN_HOST}/instructor/dashboard`,
  staffPortal: `${ADMIN_HOST}/staff-portal/dashboard`,
  adminLogin: `${ADMIN_HOST}/login`,
  caseManagerPortal: `${MARKETING_HOST}/case-manager/dashboard`,
  providerPortal: `${MARKETING_HOST}/provider/dashboard`,
  workforceBoardPortal: `${MARKETING_HOST}/workforce-board/dashboard`,

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
  programsIT: '/programs/technology',
  programsTechnology: '/programs/technology',

  apprenticeships: '/apprenticeships',
  apprenticeshipsHowItWorks: '/how-it-works',
  apprenticeshipsHostShop: '/partners/host-shops',
  apprenticeshipSponsor: '/apprenticeship-sponsor',

  funding: '/funding',
  fundingWIOA: '/funding/wioa',
  fundingJobReadyIndy: '/jri',
  fundingVocRehab: '/funding/state-programs',
  scholarships: '/scholarships',
  eligibility: '/eligibility/quiz',

  employers: '/employers',
  employersHireGraduates: '/hire-graduates',
  employersPostJob: `${LMS_HOST}/employer/dashboard`,
  forAgencies: '/for-agencies',

  about: '/about',
  aboutLocations: '/about',
  aboutApprovals: '/approvals',
  successStories: '/success-stories',
  testing: '/testing',
  blog: '/blog',
  faq: '/faq',
  contact: '/contact',

  store: '/store',
  storeDemo: '/store/demo',
} as const;

export type RouteKey = keyof typeof ROUTES;
