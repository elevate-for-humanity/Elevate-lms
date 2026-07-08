// WIOA ETPL Forms - stub for build compatibility
// These exports are required by compliance pages

export const FORM_LABELS = {
  section188: 'Section 188 Equal Opportunity Checklist',
  eligibility: 'Initial Eligibility & Aggregate Performance',
  etplPrograms: 'ETPL Program Management',
} as const;

export type FormLabel = typeof FORM_LABELS[keyof typeof FORM_LABELS];
