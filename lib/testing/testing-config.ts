/**
 * Central config for the Elevate Testing Center.
 * All contact info, location, and staff details live here.
 * Update this file — every email template and page picks up the change.
 */

export const TESTING_CENTER = {
  name:    'Elevate for Humanity Testing Center',
  address: '8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240',
  phone:   '(317) 314-3757',
  phoneTel: '+13173143757',
  email:   'testing@elevateforhumanity.org',
  coordinator: {
    name:  'Alberta Davis',
    title: 'Testing Center Coordinator',
  },
} as const;

export const TESTING_EMAIL = {
  from:       `Elevate Testing Center <${TESTING_CENTER.email}>`,
  adminEmail: TESTING_CENTER.email,
} as const;
