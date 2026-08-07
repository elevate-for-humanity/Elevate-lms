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
  // Home
  home: '/',

  // Authentication / portals
  login: `${APP_URL}/login`,
  studentPortal: `${APP_URL}/learner/dashboard`,
  employerPortal: `${APP_URL}/employer`,
  adminLogin: `${ADMIN_URL}/login`,

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
  programsIT: '/programs/it-help-desk',
  programsTechnology: '/programs/technology',

  // Apprenticeships
  apprenticeships: '/apprenticeships',
  apprenticeshipsHowItWorks: '/how-it-works',
  apprenticeshipsHostShop: '/apprenticeships/host-shop',
  apprenticeshipSponsor: '/apprenticeship-sponsor',

  // Funding
  funding: '/funding',
  fundingWIOA: '/funding/wioa',
  fundingJobReadyIndy: '/funding/job-ready-indy',
  fundingVocRehab: '/funding/state-programs',
  scholarships: '/scholarships',
  eligibility: '/eligibility/quiz',

  // Employers
  employers: '/employer',
  employersHireGraduates: '/hire-graduates',
  employersPostJob: '/employers/post-job',
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
  storeDemo: '/store/demo',
} as const;

export type RouteKey = keyof typeof ROUTES;
