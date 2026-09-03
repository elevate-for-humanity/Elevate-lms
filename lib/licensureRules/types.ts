/**
 * Licensure Rules Type Definitions
 *
 * These types define the structure for state-specific licensure rules.
 * Rules are hard-coded per state for auditability and version control.
 */

export type SourceType =
  | 'host_shop'
  | 'in_state_barber_school'
  | 'out_of_state_school'
  | 'out_of_state_license'
  | 'continuing_education';

export type EvaluationDecision =
  | 'accepted'
  | 'partially_accepted'
  | 'rejected'
  | 'requires_manual_review';

export interface LicensureRules {
  /** Unique identifier for this rule set (e.g., 'IN_2025_1') */
  rule_set_id: string;

  /** State code (e.g., 'IN', 'IL', 'OH') */
  state_code: string;

  /** Version string for tracking changes */
  version: string;

  /** Effective date of these rules */
  effective_date: string;

  /** Total hours required for licensure */
  required_total_hours: number;

  /** Maximum hours that can be transferred from other sources */
  max_transfer_hours: number;

  /** Minimum percentage of hours that must be completed in-state */
  min_in_state_percentage: number;

  /** Source types accepted for transfer credit */
  accepted_sources: SourceType[];

  /** Whether continuing education counts toward initial licensure */
  ce_counts_toward_licensure: boolean;

  /** Whether state exam is required */
  exam_required: boolean;

  /** Minimum hours before exam eligibility */
  exam_eligibility_hours: number;

  /** Category-specific requirements (optional) */
  category_requirements?: {
    [category: string]: {
      min_hours: number;
      max_transfer_hours: number;
    };
  };

  /** Notes about this rule set */
  notes?: string;
}

export interface TransferEvaluationResult {
  /** Hours claimed by applicant */
  hours_claimed: number;

  /** Hours accepted after evaluation */
  accepted_hours: number;

  /** Decision made */
  decision: EvaluationDecision;

  /** Rule set used for evaluation */
  rule_set_id: string;

  /** Hash of rules for audit trail */
  rule_hash: string;

  /** Reason codes for decision */
  reason_codes: string[];

  /** Human-readable explanation */
  explanation: string;
}
