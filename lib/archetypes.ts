// Archetype definitions for route mapping
// This file is read by scripts/archetype-mapper.mjs

export const FORBIDDEN_PHRASES: string[] = [
  'TODO',
  'FIXME',
  'XXX',
  'HACK',
  'BUG',
  'placeholder',
  'example.com',
  'your-domain',
  'localhost',
  'tbd',
  'coming soon',
  'under construction',
  'demo',
  'sample',
];

export interface Archetype {
  routeMatchers: string[];
  requiresServerAuth: boolean;
  requiresRoleGate: boolean;
  mustIncludeTokens: string[];
}

export const ARCHETYPES: Record<string, Archetype> = {
  program_training_detail: {
    routeMatchers: ['^/programs(/.*)?$', '^/courses(/.*)?$', '^/lms(/.*)?$', '^/apprenticeships(/.*)?$'],
    requiresServerAuth: false,
    requiresRoleGate: false,
    mustIncludeTokens: [],
  },
  application_enrollment_flow: {
    routeMatchers: ['^/apply(/.*)?$', '^/enroll(/.*)?$', '^/onboarding(/.*)?$', '^/application-success$', '^/checkout(/.*)?$', '^/payment(/.*)?$', '^/pay$', '^/test-enrollment$', '^/test-stripe-iframe$'],
    requiresServerAuth: false,
    requiresRoleGate: false,
    mustIncludeTokens: [],
  },
  dashboard_portal: {
    routeMatchers: ['^/dashboard(s)?(/.*)?$', '^/portal(s)?(/.*)?$', '^/student(/.*)?$', '^/student-portal$', '^/instructor(/.*)?$', '^/program-holder(/.*)?$', '^/apprentice(/.*)?$', '^/delegate(/.*)?$', '^/workforce-board(/.*)?$', '^/staff-portal(/.*)?$', '^/org(/.*)?$', '^/board(/.*)?$', '^/creator(/.*)?$', '^/cm(/.*)?$', '^/employee(/.*)?$'],
    requiresServerAuth: true,
    requiresRoleGate: true,
    mustIncludeTokens: [],
  },
  marketing_landing: {
    routeMatchers: ['^/$', '^/about$', '^/contact$', '^/faq$', '^/pricing$', '^/features$'],
    requiresServerAuth: false,
    requiresRoleGate: false,
    mustIncludeTokens: [],
  },
};
