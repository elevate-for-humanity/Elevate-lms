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
  programsBeauty: '/programs/beauty-cosmetology',
  programsBarber: '/programs/barber-apprenticeship',
  programsCosmetology: '/programs/cosmetology-apprenticeship',
  programsEsthetician: '/programs/esthetician-apprenticeship',
  programsNailTech: '/programs/nail-technician-apprenticeship',
  programsIT: '/programs/it-helpdesk',
  programsTechnology: '/programs/technology',

  // Apprenticeships
  apprenticeships: '/apprenticeships',
  apprenticeshipsHowItWorks: '/apprenticeships/how-it-works',
  apprenticeshipsHostShop: '/apprenticeships/host-shop',

  // Key apprenticeship route (was /apprenticeships/sponsor — now correct)
  apprenticeshipSponsor: '/apprenticeship-sponsor',

  // Funding
  funding: '/funding',
  fundingWIOA: '/funding/wioa',
  fundingJobReadyIndy: '/funding/job-ready-indy',
  fundingVocRehab: '/funding/voc-rehab',
  scholarships: '/scholarships',
  eligibility: '/eligibility/quiz',

  // Employers
  employers: '/employers',
  employersHireGraduates: '/hire-graduates',
  employersPostJob: '/employers/post-job',
  forAgencies: '/for-agencies',

  // About
  about: '/about',
  aboutLocations: '/about/locations',
  aboutApprovals: '/about/approvals',
  successStories: '/success-stories',
  testing: '/testing',
  blog: '/blog',
  faq: '/faq',
  contact: '/contact',

  // Store / Trials
  storeDemo: '/store/demo',
} as const;

export type RouteKey = keyof typeof ROUTES;
