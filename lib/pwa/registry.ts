export const PWA_APPLICATIONS = {
  admin: { workerPath: '/sw-admin.js', cachePrefix: 'elevate-admin-', manifestPath: '/manifest-admin.json' },
  lms: { workerPath: '/sw-lms.js', cachePrefix: 'elevate-lms-', manifestPath: '/manifest-lms.json' },
  marketing: { workerPath: '/sw-marketing.js', cachePrefix: 'elevate-marketing-', manifestPath: '/manifest-marketing.json' },
} as const;

export type PwaApplication = keyof typeof PWA_APPLICATIONS;

export const LMS_ROLE_MANIFESTS = [
  '/manifest-lms.json',
  '/manifest-student.json',
  '/manifest-apprentice.json',
  '/manifest-employer.json',
  '/manifest-program-holder.json',
  '/manifest-shop-owner.json',
] as const;
