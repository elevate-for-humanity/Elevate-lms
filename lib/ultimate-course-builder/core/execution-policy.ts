import type { UltimateBuildStep } from './types';

/**
 * Development acceptance policy for Ultimate Course Builder.
 * Instructional findings are observations during full-course builds.
 * Platform security, authorization, data-integrity and licensing controls
 * remain outside this policy and are never bypassed here.
 */
export const ULTIMATE_EXECUTION_POLICY = {
  mode: 'progressive-observation',
  instructionalFindingsBlockProgress: false,
  recordFindings: true,
  continueThroughAllTwentySteps: true,
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
