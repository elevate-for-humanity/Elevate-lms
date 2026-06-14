/**
 * Licensure Rules Engine
 *
 * Hard-coded state rules for automatic transfer evaluation.
 * Rules are versioned and hashed for audit trail.
 */

import crypto from 'crypto';
import type {
  LicensureRules,
  SourceType,
  TransferEvaluationResult,
  EvaluationDecision,
} from './types';
import { INDIANA_RULES } from './IN';

// Export types
export * from './types';

// Registry of all state rules
const STATE_RULES: Record<string, LicensureRules> = {
  IN: INDIANA_RULES,
};

// Supported states
export const SUPPORTED_STATES = Object.keys(STATE_RULES);

/**
 * Get rules for a specific state
 */
export function getRules(stateCode: string): LicensureRules | null {
  return STATE_RULES[stateCode.toUpperCase()] || null;
}

/**
 * Generate SHA-256 hash of rules for audit trail
 */
export function hashRules(rules: LicensureRules): string {
  const ruleString = JSON.stringify(rules);
  return crypto.createHash('sha256').update(ruleString).digest('hex').substring(0, 16);
}

/**
 * Evaluate transfer hours against state rules
 *
 * This is AUTOMATIC evaluation - no manual intervention for standard cases.
 * Returns 'requires_manual_review' only for edge cases.
 */
export function evaluateTransfer(params: {
  target_state: string;
  source_type: SourceType;
  source_state?: string;
  hours_claimed: number;
  current_accepted_hours?: number;
  has_documents?: boolean;
}): TransferEvaluationResult {
  const rules = getRules(params.target_state);

  // State not supported - requires manual review
  if (!rules) {
    return {
      hours_claimed: params.hours_claimed,
      accepted_hours: 0,
      decision: 'requires_manual_review',
      rule_set_id: 'UNKNOWN',
      rule_hash: 'UNKNOWN',
      reason_codes: ['STATE_NOT_SUPPORTED'],
      explanation: `State ${params.target_state} is not in our rules database. Manual review required.`,
    };
  }

  const ruleHash = hashRules(rules);
  const reasonCodes: string[] = [];
  let decision: EvaluationDecision = 'accepted';
  let acceptedHours = params.hours_claimed;

  // Check if source type is accepted
  if (!rules.accepted_sources.includes(params.source_type)) {
    return {
      hours_claimed: params.hours_claimed,
      accepted_hours: 0,
      decision: 'rejected',
      rule_set_id: rules.rule_set_id,
      rule_hash: ruleHash,
      reason_codes: ['SOURCE_TYPE_NOT_ACCEPTED'],
      explanation: `Source type '${params.source_type}' is not accepted for transfer credit in ${rules.state_code}.`,
    };
  }

  // CE never counts toward licensure (if that's the rule)
  if (params.source_type === 'continuing_education' && !rules.ce_counts_toward_licensure) {
    return {
      hours_claimed: params.hours_claimed,
      accepted_hours: 0,
      decision: 'rejected',
      rule_set_id: rules.rule_set_id,
      rule_hash: ruleHash,
      reason_codes: ['CE_NOT_COUNTED'],
      explanation: 'Continuing education hours do not count toward initial licensure in Indiana.',
    };
  }

  // Check documents for transfer sources
  if (params.source_type !== 'host_shop' && !params.has_documents) {
    return {
      hours_claimed: params.hours_claimed,
      accepted_hours: 0,
      decision: 'requires_manual_review',
      rule_set_id: rules.rule_set_id,
      rule_hash: ruleHash,
      reason_codes: ['DOCUMENTS_MISSING'],
      explanation:
        'Transfer credit requires documentation (transcript, certificate, or license verification).',
    };
  }

  // Calculate current transfer total
  const currentTransferHours = params.current_accepted_hours || 0;
  const remainingTransferCapacity = rules.max_transfer_hours - currentTransferHours;

  // Cap at remaining transfer capacity
  if (params.source_type !== 'host_shop' && acceptedHours > remainingTransferCapacity) {
    acceptedHours = Math.max(0, remainingTransferCapacity);
    decision = 'partially_accepted';
    reasonCodes.push('TRANSFER_CAP_REACHED');
  }

  // Cap at total program requirement
  const totalAfterAcceptance = currentTransferHours + acceptedHours;
  if (totalAfterAcceptance > rules.required_total_hours) {
    acceptedHours = Math.max(0, rules.required_total_hours - currentTransferHours);
    decision = 'partially_accepted';
    reasonCodes.push('PROGRAM_CAP_REACHED');
  }

  // Build explanation
  let explanation: string;
  if (decision === 'accepted') {
    explanation = `All ${acceptedHours} hours accepted under ${rules.rule_set_id}.`;
  } else if (decision === 'partially_accepted') {
    explanation = `${acceptedHours} of ${params.hours_claimed} hours accepted. `;
    if (reasonCodes.includes('TRANSFER_CAP_REACHED')) {
      explanation += `Transfer limit (${rules.max_transfer_hours} hours) reached. `;
    }
    if (reasonCodes.includes('PROGRAM_CAP_REACHED')) {
      explanation += `Program requirement (${rules.required_total_hours} hours) reached.`;
    }
  }

  return {
    hours_claimed: params.hours_claimed,
    accepted_hours: acceptedHours,
    decision,
    rule_set_id: rules.rule_set_id,
    rule_hash: ruleHash,
    reason_codes: reasonCodes.length > 0 ? reasonCodes : ['STANDARD_ACCEPTANCE'],
    explanation,
  };
}

/**
 * Check if apprentice is eligible for state exam
 */
export function checkExamEligibility(params: {
  state: string;
  total_accepted_hours: number;
  has_pending_reviews: boolean;
}): { eligible: boolean; reason: string } {
  const rules = getRules(params.state);

  if (!rules) {
    return { eligible: false, reason: 'State rules not found.' };
  }

  if (params.has_pending_reviews) {
    return { eligible: false, reason: 'Pending transfer reviews must be completed first.' };
  }

  if (params.total_accepted_hours < rules.exam_eligibility_hours) {
    const remaining = rules.exam_eligibility_hours - params.total_accepted_hours;
    return {
      eligible: false,
      reason: `${remaining} more hours required. Current: ${params.total_accepted_hours}/${rules.exam_eligibility_hours}.`,
    };
  }

  return { eligible: true, reason: 'All requirements met for exam eligibility.' };
}

/**
 * Calculate remaining hours needed
 */
export function calculateRemainingHours(params: { state: string; total_accepted_hours: number }): {
  remaining: number;
  total_required: number;
  percentage_complete: number;
} {
  const rules = getRules(params.state);

  if (!rules) {
    return { remaining: 0, total_required: 0, percentage_complete: 0 };
  }

  const remaining = Math.max(0, rules.required_total_hours - params.total_accepted_hours);
  const percentage = Math.min(
    100,
    (params.total_accepted_hours / rules.required_total_hours) * 100,
  );

  return {
    remaining,
    total_required: rules.required_total_hours,
    percentage_complete: Math.round(percentage * 10) / 10,
  };
}
