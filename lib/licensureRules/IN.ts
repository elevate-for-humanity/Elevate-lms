/**
 * Indiana Barber Licensure Rules
 *
 * Based on Indiana Professional Licensing Agency (IPLA) requirements.
 *
 * IMPORTANT: This is program credit calculation only.
 * Final licensure decisions are made by IPLA.
 *
 * Rule Set ID: IN_2025_1
 * Effective: January 2025
 */

import type { LicensureRules } from './types';

export const INDIANA_RULES: LicensureRules = {
  rule_set_id: 'IN_2025_1',
  state_code: 'IN',
  version: '2025.1',
  effective_date: '2025-01-01',

  // Total hours required for Indiana barber license
  required_total_hours: 2000,

  // Maximum hours that can be transferred (50% of total)
  max_transfer_hours: 1000,

  // At least 50% must be completed in Indiana
  min_in_state_percentage: 50,

  // Accepted sources for transfer credit
  accepted_sources: [
    'host_shop',
    'in_state_barber_school',
    'out_of_state_school',
    'out_of_state_license',
  ],

  // CE does NOT count toward initial licensure
  ce_counts_toward_licensure: false,

  // State exam is required
  exam_required: true,

  // Must have all hours before exam
  exam_eligibility_hours: 2000,

  // Category-specific requirements (Indiana tracks these)
  category_requirements: {
    practical_training: {
      min_hours: 1500,
      max_transfer_hours: 750,
    },
    theory_instruction: {
      min_hours: 500,
      max_transfer_hours: 250,
    },
  },

  notes:
    'Indiana requires completion of a USDOL Registered Apprenticeship or licensed barber school program. Final licensure approval is determined by the Indiana Professional Licensing Agency (IPLA).',
};

export default INDIANA_RULES;
