export const PWA_APPLICATIONS = {
  admin: { workerPath: '/sw-admin.js', cachePrefix: 'elevate-admin-', manifestPath: '/manifest-admin.json', scope: '/' },
  lms: { workerPath: '/sw-lms.js', cachePrefix: 'elevate-lms-', manifestPath: '/manifest-lms.json', scope: '/' },
  marketing: { workerPath: '/sw-marketing.js', cachePrefix: 'elevate-marketing-', manifestPath: '/manifest-marketing.json', scope: '/' },
  // Elevate Mail shares the Admin origin but owns the /mail/ scope: its own
  // worker, caches, manifest, and install identity, insulated from Admin's.
  mail: { workerPath: '/sw-mail.js', cachePrefix: 'elevate-mail-', manifestPath: '/manifest-mail.json', scope: '/mail/' },
  // The phone system is its own application on the Admin origin: its worker
  // is scoped to /phone/ so Admin deploys (which restamp sw-admin.js on
  // every release) can never churn the registration that owns the phone's
  // call-wake push subscription.
  phone: { workerPath: '/sw-phone.js', cachePrefix: 'elevate-phone-', manifestPath: '/manifest-phone.json', scope: '/phone/' },
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

// Install surfaces live inside each app's own scope (PWA audit 2026-11-28):
// the page that offers the install must link the app's manifest and be
// controlled by a covering worker, or Chrome never fires
// beforeinstallprompt. The static pages under /install/*.html are offline
// draft pads only — they are never the install target.
export const ADMIN_WORKSPACE_PWAS = {
  'dev-studio': { name: 'Dev Studio', openPath: '/studio', installPath: '/studio/install' },
  'course-builder': { name: 'Course Builder', openPath: '/studio/courses', installPath: '/studio/courses/install' },
  email: { name: 'Email', openPath: '/mail', installPath: '/mail/install' },
} as const;
