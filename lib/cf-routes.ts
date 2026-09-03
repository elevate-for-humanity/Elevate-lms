import { siteConfig } from '@/content/cf-site';

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
