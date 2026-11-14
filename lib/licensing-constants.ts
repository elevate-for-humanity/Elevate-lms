export const LICENSING_ROUTES = {
  demo: '/demo',
  admin: '/demo/admin',
  learner: '/demo/learner',
  pricing: '/pricing',
  contact: '/contact',
  schedule: '/contact',
} as const;

export type LicensingRoute = keyof typeof LICENSING_ROUTES;
