import { siteConfig } from '@/content/site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const routes = {
  home: '/',
  programs: '/programs',
  program: (slug: string) => `/programs/${slug}`,
  careerTraining: '/career-training',
  careerTrainingState: (state: string) => `/career-training/${state}`,
  communityServices: '/community-services',
  communityServicesState: (state: string) => `/community-services/${state}`,
  cnaWaitlist: '/cna-waitlist',
  policies: '/policies',
  policy: (slug: string) => `/policies/${slug}`,
  legal: '/legal',
  legalDoc: (slug: string) => `/legal/${slug}`,
  about: '/about',
  contact: '/contact',
  funding: '/funding',
  enrollment: '/enrollment',
  apply: siteConfig.handoff.apply,
  login: siteConfig.handoff.login,
  checkout: siteConfig.handoff.checkout,
} as const;

/**
 * Canonical application route constants.
 *
 * All CTA buttons and links must import ROUTES from here.
 * Do not hardcode application paths anywhere else in the codebase.
 *
 * Barber apply canonical: /programs/barber-apprenticeship/apply
 * Everything else 301s to it — see next.config.mjs redirects.
 */
export const ROUTES = {
  // ── Barber Apprenticeship ─────────────────────────────────────────────────
  BARBER_APPLY:       '/programs/barber-apprenticeship/apply',
  BARBER_PROGRAM:     '/programs/barber-apprenticeship',
  BARBER_ELIGIBILITY: '/programs/barber-apprenticeship/eligibility',

  // ── General intake (non-barber programs) ─────────────────────────────────
  APPLY: '/apply',
  applyForProgram: (slug: string) => `/apply?program=${slug}`,

  // ── Partner / shop apply ──────────────────────────────────────────────────
  PARTNER_BARBERSHOP_APPLY: '/partners/barber-host-shop/apply',
} as const;
