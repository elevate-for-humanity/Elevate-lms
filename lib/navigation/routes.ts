/**
 * Canonical Route Constants — single source of truth for all navigation routes.
 *
 * Usage:
 *   import { ROUTES } from '@/lib/navigation/routes';
 *   href={ROUTES.programs}
 *
 * These routes must match actual Next.js page files in apps/marketing/app/.
 * If a route returns 404, either create the page or update the constant.
 */

export const ROUTES = {
  // Home
  home: '/',

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
  apprenticeshipsHowItWorks: '/how-it-works', // '/apprenticeships/how-it-works' doesn't exist; use /how-it-works
  apprenticeshipsHostShop: '/apprenticeships/host-shop',

  // Key apprenticeship route (was /apprenticeships/sponsor — now correct)
  apprenticeshipSponsor: '/apprenticeship-sponsor',

  // Funding
  funding: '/funding',
  fundingWIOA: '/funding/wioa',
  fundingJobReadyIndy: '/funding/job-ready-indy',
  fundingVocRehab: '/funding/state-programs',  // /funding/voc-rehab doesn't exist; use state-programs
  scholarships: '/scholarships',
  eligibility: '/eligibility/quiz',

  // Employers
  employers: '/employer',           // /employer page exists; /employers doesn't
  employersHireGraduates: '/hire-graduates',
  employersPostJob: '/employers/post-job',  // /employers/post-job exists
  forAgencies: '/for-agencies',

  // About
  about: '/about',
  aboutLocations: '/about',               // /about/locations doesn't exist; use /about
  aboutApprovals: '/approvals',          // page is /approvals not /about/approvals
  successStories: '/success-stories',
  testing: '/testing',                   // /testing/testing-center doesn't exist; use /testing
  blog: '/blog',
  faq: '/faq',
  contact: '/contact',

  // Store / Trials
  storeDemo: '/store/demo',
} as const;

export type RouteKey = keyof typeof ROUTES;
