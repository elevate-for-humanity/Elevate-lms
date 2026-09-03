/**
 * Canonical URL paths for WIOA / INTraining ETPL compliance forms.
 * Use these helpers so public pages, sitemap, and admin stay in sync.
 */

export const WIOA_COMPLIANCE = {
  hub: '/compliance/wioa',
  ieapTemplate: '/compliance/wioa/initial-eligibility-aggregate-performance',
  section188Template: '/compliance/wioa/section-188-equal-opportunity-checklist',
  programHub: (slug: string) => `/compliance/wioa/programs/${slug}`,
  programIeap: (slug: string) =>
    `/compliance/wioa/programs/${slug}/initial-eligibility-aggregate-performance`,
  programSection188: (slug: string) =>
    `/compliance/wioa/programs/${slug}/section-188-equal-opportunity-checklist`,
} as const;

export const ADMIN_WIOA_COMPLIANCE = {
  hub: '/admin/compliance/wioa-etpl',
  programHub: (programId: string) => `/admin/compliance/wioa-etpl/${programId}`,
  programIeap: (programId: string) =>
    `/admin/compliance/wioa-etpl/${programId}/initial-eligibility-aggregate-performance`,
  programSection188: (programId: string) =>
    `/admin/compliance/wioa-etpl/${programId}/section-188-equal-opportunity-checklist`,
} as const;
