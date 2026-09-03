import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Central config for the Elevate Testing Center.
 * All contact info, location, and staff details live here.
 * Update this file — every email template and page picks up the change.
 */

export const TESTING_CENTER = {
  name: 'Elevate for Humanity Testing Center',
  address: '120 E. Market St., Suite 930, Indianapolis, IN 46204',
  phone: '' + PLATFORM_DEFAULTS.supportPhone + '',
  phoneTel: '+13173143757',
  email: 'testing@elevateforhumanity.org',
  contact: {
    name: 'Elizabeth Greene',
    title: 'Founder & CEO / EPA 608 Certified Proctor',
  },
  coordinator: {
    name: 'Alberta Davis',
    title: 'Testing Center Coordinator',
  },
  policy: {
    arriveMinutesBefore: 15,
    appointmentOnly: true,
    idRequired: 'Government-issued photo ID required.',
    noWalkIns: 'By appointment only — walk-ins are not accepted.',
    cancellationPolicy: 'Fees are non-refundable unless the exam is canceled by Elevate.',
    workforceFunding:
      'Workforce-funded candidates (WIOA, WorkOne) may have fees covered — contact us before booking.',
  },
} as const;

export const TESTING_EMAIL = {
  from: `Elevate Testing Center <${TESTING_CENTER.email}>`,
  adminEmail: TESTING_CENTER.email,
} as const;
