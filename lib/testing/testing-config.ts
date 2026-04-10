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
  policy: {
    arriveMinutesBefore: 15,
    appointmentOnly: true,
    idRequired: 'Government-issued photo ID required.',
    noWalkIns: 'By appointment only — walk-ins are not accepted.',
    cancellationPolicy: 'Fees are non-refundable unless the exam is canceled by Elevate.',
    workforceFunding: 'Workforce-funded candidates (WIOA, WorkOne) may have fees covered — contact us before booking.',
  },
} as const;

/**
 * Calendly configuration for testing center scheduling.
 *
 * CALENDLY_PAT is stored in app_secrets (Supabase) — never in env vars or code.
 * Read at runtime via getCalendlyToken() in lib/testing/calendly.ts.
 *
 * To create the testing-specific event type:
 *   1. Go to https://calendly.com/elevate4humanityedu
 *   2. Create a new event type: "Testing Center Appointment" — 60 min, in-person
 *   3. Set the slug to "testing" → URL becomes calendly.com/elevate4humanityedu/testing
 *   4. Update CALENDLY_TESTING_URL below
 *
 * Until the dedicated event type is created, CALENDLY_TESTING_URL falls back
 * to the general scheduling page.
 */
export const CALENDLY_CONFIG = {
  userUri:      'https://api.calendly.com/users/8c7a5621-62c0-4193-ad08-0952e24485f9',
  schedulingUrl: 'https://calendly.com/elevate4humanityedu',
  testingUrl:   process.env.NEXT_PUBLIC_CALENDLY_TESTING_URL
                  ?? 'https://calendly.com/elevate4humanityedu/60min',
} as const;

export const TESTING_EMAIL = {
  from:       `Elevate Testing Center <${TESTING_CENTER.email}>`,
  adminEmail: TESTING_CENTER.email,
} as const;
