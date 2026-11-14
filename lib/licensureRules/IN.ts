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
  rule_set_id: 'IN_BARBER_SCHOOL_2026_10_31',
  state_code: 'IN',
  version: '2026.10.31',
  effective_date: '2026-10-31',

  // Total hours required for Indiana barber license
  required_total_hours: 1500,

  // Existing institutional transfer-policy compatibility value; not a verified PLA statutory cap.
  max_transfer_hours: 1000,

  // Existing institutional in-state policy; not represented as a verified PLA requirement.
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
  exam_eligibility_hours: 1500,

  // Do not invent a 1,500-practical + 500-theory allocation for the 1,500-hour school route.

  notes:
    'PLA school-route minimum: 1,500 barber education hours. Source verified 2026-10-31: https://www.in.gov/pla/professions/cosmetology-and-barber-home/cosmetology-and-barber-licensing-information/ . Registered-apprenticeship completion is an alternative pathway, governed by its approved standard, not this school-hour threshold. Existing transfer-policy fields are institutional compatibility settings requiring case-specific review; final licensing approval rests with PLA.',
};

export default INDIANA_RULES;
