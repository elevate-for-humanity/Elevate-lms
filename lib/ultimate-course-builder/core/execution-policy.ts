import type { UltimateBuildStep } from './types';

/**
 * Production acceptance policy for Ultimate Course Builder.
 * Error findings block dependent stages and publication.
 * Platform security, authorization, data-integrity and licensing controls
 * remain outside this policy and are never bypassed here.
 */
export const ULTIMATE_EXECUTION_POLICY = {
  mode: 'fail-closed-versioned-contract',
  instructionalFindingsBlockProgress: true,
  recordFindings: true,
  continueThroughAllTwentySteps: false,
} as const;

export type UltimateInstructionalFinding = {
  step: UltimateBuildStep;
  severity: 'info' | 'warning' | 'error';
  code: string;
  message: string;
};

export function instructionalFindingBlocksProgress(): boolean {
  return ULTIMATE_EXECUTION_POLICY.instructionalFindingsBlockProgress;
}
