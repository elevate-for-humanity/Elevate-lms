// WIOA ETPL Routes - stub for build compatibility
// These exports are required by compliance pages

export const WIOA_COMPLIANCE = {
  section188: '/compliance/wioa/section-188-equal-opportunity-checklist',
  eligibility: '/compliance/wioa/initial-eligibility-aggregate-performance',
  etplPrograms: '/compliance/wioa/programs',
} as const;

export type ComplianceRoute = typeof WIOA_COMPLIANCE[keyof typeof WIOA_COMPLIANCE];
