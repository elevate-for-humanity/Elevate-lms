/**
 * Existing Hair Stylist/Cosmetologist operational RAPIDS settings.
 * This configuration is not a substitute for the signed occupation Appendix A.
 * Keep the hybrid work term separate from RTI and state licensing requirements.
 */
export const HAIR_STYLIST_PROGRAM = {
  slug: 'cosmetology-apprenticeship',
  name: 'Hair Stylist Apprenticeship',
  occupation: 'Hair Stylist',
  existingTitle: 'Cosmetologist',
  onetSocCode: '39-5012.00',
  rapidsCode: '0096HY',
  rapidsVersion: 'V1',
  approach: 'hybrid' as const,
  minimumTermHours: 2000,
  maximumTermHours: 2500,
  relatedInstructionHours: 154,
  probationaryHours: 500,
  apprenticeToMentorRatio: '1:1',
} as const;
