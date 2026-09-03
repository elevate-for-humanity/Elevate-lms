// Mapping of program IDs to course slugs that should be auto-assigned
// when a learner is enrolled for that program via Stripe payment.
export const programToCourseSlugs: Record<string, string[]> = {
  // Healthcare
  'prog-cna': ['job-ready-indy-core'],

  // Barber
  'prog-barber': ['barber-apprentice-foundations'],

  // Tax
  'prog-tax-vita': ['tax-vita-onramp'],

  // HVAC
  'prog-hvac': ['hvac-tech-foundations'],

  // CDL
  'prog-cdl': ['cdl-eldt-core'],

  // NEW: Business Apprenticeship
  'prog-business-apprentice': ['business-apprentice-foundations'],

  // NEW: Esthetics Apprenticeship
  'prog-esthetics-apprentice': ['esthetics-apprentice-foundations'],
};
