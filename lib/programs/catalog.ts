/**
 * PROGRAM CATALOG - Single Source of Truth
 * 
 * All program pages MUST read from this file.
 * Do not hardcode prices, hours, or billing rules elsewhere.
 * 
 * Pricing values are non-negotiable and must match exactly.
 */

export interface ProgramPricing {
  program_id: string;
  hours_total: number;
  full_price: number;
  setup_fee_rate: number;
  setup_fee_amount: number;
  remaining_balance: number;
  billing_frequency: 'weekly' | 'monthly' | 'one-time';
  billing_day: string;
  first_charge_rule: string;
  transfer_hours_supported: boolean;
}

export interface ProgramCatalogEntry {
  program_id: string;
  slug: string;
  name: string;
  short_name: string;
  
  // Hours
  hours_total: number;
  related_instruction_hours: number;
  ojt_hours: number;
  
  // Duration
  duration_range: string;
  duration_months: { min: number; max: number };
  
  // Pricing (non-negotiable)
  pricing: ProgramPricing;
  
  // Credentials
  credential: string;
  credential_full: string;
  
  // Program details
  category: 'apprenticeship' | 'training' | 'certification';
  is_registered_apprenticeship: boolean;
  rapids_codes?: string[];
  
  // State requirements
  state_requirements: string;
  states_active: string[];
  
  // Funding
  funding_options: string[];
  
  // Wages
  starting_wage: string;
  wage_range: string;
  career_outcome_range: string;
  
  // Administrator
  administrator: string;
  administrator_statement: string;
}

// Standard administrator statement
export const ADMINISTRATOR_STATEMENT = 
  "Elevate for Humanity serves as the Program Administrator for registered apprenticeship pathways, coordinating training, employer participation, and funding access.";

/**
 * BARBER APPRENTICESHIP - Canonical Values (Non-Negotiable)
 */
export const BARBER_PROGRAM: ProgramCatalogEntry = {
  program_id: 'BARBER',
  slug: 'barber-apprenticeship',
  name: 'Barber Apprenticeship',
  short_name: 'Barber',
  
  // Hours
  hours_total: 2000,
  related_instruction_hours: 144,
  ojt_hours: 1856,
  
  // Duration
  duration_range: '15-24 months',
  duration_months: { min: 15, max: 24 },
  
  // Pricing (NON-NEGOTIABLE)
  pricing: {
    program_id: 'BARBER',
    hours_total: 2000,
    full_price: 4980,
    setup_fee_rate: 0.35,
    setup_fee_amount: 1743,
    remaining_balance: 3237,
    billing_frequency: 'weekly',
    billing_day: 'Friday',
    first_charge_rule: 'first Friday AFTER enrollment',
    transfer_hours_supported: true,
  },
  
  // Credentials
  credential: 'Indiana Barber License',
  credential_full: 'Indiana Registered Barber License (State Board Certified)',
  
  // Program details
  category: 'apprenticeship',
  is_registered_apprenticeship: true,
  rapids_codes: ['0626CB'],
  
  // State requirements
  state_requirements: 'Indiana requires 2,000 hours of training for barber licensure.',
  states_active: ['Indiana'],
  
  // Funding
  funding_options: ['WIOA', 'Workforce Ready Grant', 'JRI', 'Employer Sponsorship', 'Self-Pay'],
  
  // Wages
  starting_wage: '$10-12/hour + tips',
  wage_range: '$10-18/hour during training',
  career_outcome_range: '$35,000-$65,000+/year',
  
  // Administrator
  administrator: 'Elevate for Humanity Career & Technical Institute',
  administrator_statement: ADMINISTRATOR_STATEMENT,
};

/**
 * PROGRAM CATALOG - All Programs
 */
export const PROGRAM_CATALOG: Record<string, ProgramCatalogEntry> = {
  'barber-apprenticeship': BARBER_PROGRAM,
  
  // Placeholder for future programs - add as needed
  // 'cna': CNA_PROGRAM,
  // 'hvac-apprenticeship': HVAC_PROGRAM,
};

// Helper functions
export function getProgram(slug: string): ProgramCatalogEntry | undefined {
  return PROGRAM_CATALOG[slug];
}

export function getProgramPricing(slug: string): ProgramPricing | undefined {
  return PROGRAM_CATALOG[slug]?.pricing;
}

export function getProgramById(programId: string): ProgramCatalogEntry | undefined {
  return Object.values(PROGRAM_CATALOG).find(p => p.program_id === programId);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatHours(hours: number): string {
  return hours.toLocaleString();
}

/**
 * Calculate weekly payment based on hours per week
 * Formula: remaining_balance / (hours_total / hours_per_week)
 */
export function calculateWeeklyPayment(
  pricing: ProgramPricing,
  hoursPerWeek: number,
  transferHours: number = 0
): { weekly: number; weeks: number } {
  const remainingHours = pricing.hours_total - transferHours;
  const weeks = Math.ceil(remainingHours / hoursPerWeek);
  const weekly = pricing.remaining_balance / weeks;
  return { weekly: Math.round(weekly * 100) / 100, weeks };
}

/**
 * Get weekly payment examples for display
 */
export function getWeeklyPaymentExamples(pricing: ProgramPricing): Array<{
  hoursPerWeek: number;
  weekly: string;
  weeks: number;
}> {
  const examples = [40, 30, 25];
  return examples.map(hrs => {
    const { weekly, weeks } = calculateWeeklyPayment(pricing, hrs);
    return {
      hoursPerWeek: hrs,
      weekly: `$${weekly.toFixed(2)}`,
      weeks,
    };
  });
}

// Validation helper
export function validateProgramPricing(slug: string, displayedPrice: number): boolean {
  const program = PROGRAM_CATALOG[slug];
  if (!program) return false;
  return program.pricing.full_price === displayedPrice;
}
