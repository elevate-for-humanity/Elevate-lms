/**
 * Program Constants - Single Source of Truth (SSOT)
 * 
 * IMPORTANT: Update these values here to change them across the entire site.
 * All program pages, tuition tables, and marketing materials should import from this file.
 * 
 * Last updated: January 2026
 * Effective date: January 2026
 */

// =============================================================================
// BARBER APPRENTICESHIP PROGRAM
// =============================================================================
export const BARBER_PROGRAM = {
  name: 'Barber Apprenticeship',
  slug: 'barber-apprenticeship',
  
  // Hours and Duration
  totalHours: 2000,
  totalHoursFormatted: '2,000',
  durationWeeks: 52,
  durationMonths: 12,
  durationFormatted: '12 months',
  hoursPerWeek: 40,
  
  // Pricing (in cents for Stripe, dollars for display)
  tuitionCents: 498000,
  tuitionDollars: 4980,
  tuitionFormatted: '$4,980',
  examFeeCents: 10000,
  examFeeDollars: 100,
  examFeeFormatted: '$100',
  materialsCents: 0,
  materialsDollars: 0,
  materialsFormatted: 'Included',
  totalCostCents: 508000,
  totalCostDollars: 5080,
  totalCostFormatted: '$5,080',
  
  // Funding
  fundingOptions: ['WIOA', 'Apprenticeship Grants', 'Self-Pay', 'Payment Plans'],
  wioaEligible: true,
  apprenticeshipRegistered: true,
  registrationNumber: 'IN-2024-0001', // USDOL registration
  
  // Wages
  startingWageMin: 12,
  startingWageMax: 15,
  startingWageFormatted: '$12-15/hr',
  experiencedWageMin: 18,
  experiencedWageMax: 25,
  experiencedWageFormatted: '$18-25/hr',
  
  // Certification
  certificationName: 'Indiana Barber License',
  certifyingBody: 'Indiana Professional Licensing Agency (IPLA)',
  examName: 'Indiana State Barber Examination',
  
  // Requirements
  minimumAge: 16,
  educationRequirement: 'High School Diploma or GED (or enrolled)',
  backgroundCheckRequired: true,
  
  // Description
  shortDescription: 'Earn while you learn with our USDOL-registered barber apprenticeship program.',
  longDescription: 'Complete 2,000 hours of hands-on training at a licensed barbershop while earning wages. Graduate with your Indiana Barber License and real-world experience.',
} as const;

// =============================================================================
// COSMETOLOGY APPRENTICESHIP PROGRAM
// =============================================================================
export const COSMETOLOGY_PROGRAM = {
  name: 'Cosmetology Apprenticeship',
  slug: 'cosmetology-apprenticeship',
  
  // Hours and Duration
  totalHours: 2000,
  totalHoursFormatted: '2,000',
  durationWeeks: 52,
  durationMonths: 12,
  durationFormatted: '10 months',
  hoursPerWeek: 40,
  
  // Pricing
  tuitionCents: 498000,
  tuitionDollars: 4980,
  tuitionFormatted: '$4,980',
  examFeeCents: 10000,
  examFeeDollars: 100,
  examFeeFormatted: '$100',
  materialsCents: 0,
  materialsDollars: 0,
  materialsFormatted: 'Included',
  totalCostCents: 508000,
  totalCostDollars: 5080,
  totalCostFormatted: '$5,080',
  
  // Funding
  fundingOptions: ['WIOA', 'Apprenticeship Grants', 'Self-Pay', 'Payment Plans'],
  wioaEligible: true,
  apprenticeshipRegistered: true,
  
  // Certification
  certificationName: 'Indiana Cosmetology License',
  certifyingBody: 'Indiana Professional Licensing Agency (IPLA)',
} as const;

// =============================================================================
// ESTHETICIAN APPRENTICESHIP PROGRAM
// =============================================================================
export const ESTHETICIAN_PROGRAM = {
  name: 'Esthetician Apprenticeship',
  slug: 'esthetician-apprenticeship',
  
  // Hours and Duration
  totalHours: 700,
  totalHoursFormatted: '700',
  durationWeeks: 20,
  durationMonths: 5,
  durationFormatted: '5 months',
  hoursPerWeek: 35,
  
  // Pricing
  tuitionCents: 349000,
  tuitionDollars: 3490,
  tuitionFormatted: '$3,490',
  examFeeCents: 10000,
  examFeeDollars: 100,
  examFeeFormatted: '$100',
  
  // Certification
  certificationName: 'Indiana Esthetician License',
  certifyingBody: 'Indiana Professional Licensing Agency (IPLA)',
} as const;

// =============================================================================
// NAIL TECHNICIAN APPRENTICESHIP PROGRAM
// =============================================================================
export const NAIL_TECH_PROGRAM = {
  name: 'Nail Technician Apprenticeship',
  slug: 'nail-technician-apprenticeship',
  
  // Hours and Duration
  totalHours: 450,
  totalHoursFormatted: '450',
  durationWeeks: 12,
  durationMonths: 3,
  durationFormatted: '3 months',
  hoursPerWeek: 35,
  
  // Pricing
  tuitionCents: 249000,
  tuitionDollars: 2490,
  tuitionFormatted: '$2,490',
  examFeeCents: 10000,
  examFeeDollars: 100,
  examFeeFormatted: '$100',
  
  // Certification
  certificationName: 'Indiana Manicurist License',
  certifyingBody: 'Indiana Professional Licensing Agency (IPLA)',
} as const;

// =============================================================================
// TUITION EFFECTIVE DATE
// =============================================================================
export const TUITION_EFFECTIVE_DATE = 'January 2026';
export const TUITION_LAST_UPDATED = '2026-01-01';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format currency for display
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Format hours for display
 */
export function formatHours(hours: number): string {
  return new Intl.NumberFormat('en-US').format(hours);
}

// =============================================================================
// ALL PROGRAMS (for iteration)
// =============================================================================
export const ALL_APPRENTICESHIP_PROGRAMS = [
  BARBER_PROGRAM,
  COSMETOLOGY_PROGRAM,
  ESTHETICIAN_PROGRAM,
  NAIL_TECH_PROGRAM,
] as const;

// Type exports
export type BarberProgram = typeof BARBER_PROGRAM;
export type CosmetologyProgram = typeof COSMETOLOGY_PROGRAM;
export type EstheticianProgram = typeof ESTHETICIAN_PROGRAM;
export type NailTechProgram = typeof NAIL_TECH_PROGRAM;
