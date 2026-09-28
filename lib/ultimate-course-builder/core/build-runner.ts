import {
  ULTIMATE_BUILD_STEPS,
  type UltimateBuildStep,
  type UltimateCredentialProfile,
} from './types';
import type { UltimateInstructionalFinding } from './execution-policy';

export type StepHandler = (ctx: UltimateRunContext) => Promise<{
  findings?: UltimateInstructionalFinding[];
  artifacts?: Record<string, unknown>;
  /** Explicit result for validation/QA gates. False is persisted as failed and
   * prevents every downstream step from running. */
  passed?: boolean;
}>;

export interface UltimateRunContext {
  buildId: string;
  courseId: string;
  profile: UltimateCredentialProfile;
  lessonBuildId?: string;
  artifacts: Partial<Record<UltimateBuildStep, Record<string, unknown>>>;
  findings: UltimateInstructionalFinding[];
  persistStep?: (input: {
    step: UltimateBuildStep;
    state: 'running' | 'passed' | 'failed';
    artifacts?: Record<string, unknown>;
    findings?: UltimateInstructionalFinding[];
  }) => Promise<void>;
  persistFinding?: (finding: UltimateInstructionalFinding) => Promise<void>;
  persistArtifact?: (input: {
    step: UltimateBuildStep;
    artifacts: Record<string, unknown>;
  }) => Promise<void>;
  passedSteps?: Set<UltimateBuildStep>;
}

export class UltimateBuildRunner {
  constructor(private handlers: Partial<Record<UltimateBuildStep, StepHandler>>) {}

  async run(ctx: UltimateRunContext) {
    for (const step of ULTIMATE_BUILD_STEPS) {
      if (ctx.passedSteps?.has(step)) continue;
      const handler = this.handlers[step];
      if (!handler) {
        const finding: UltimateInstructionalFinding = {
          step,
          severity: 'error',
          code: 'HANDLER_NOT_IMPLEMENTED',
          message: `No handler registered for ${step}`,
        };
        ctx.findings.push(finding);
        await ctx.persistFinding?.(finding);
        await ctx.persistStep?.({ step, state: 'failed', findings: [finding] });
        break;
      }

      await ctx.persistStep?.({ step, state: 'running' });
      try {
        const result = await handler(ctx);
        const artifacts = result.artifacts ?? {};
        const findings = result.findings ?? [];
        ctx.artifacts[step] = artifacts;
        await ctx.persistArtifact?.({ step, artifacts });
        ctx.findings.push(...findings);
        for (const finding of findings) await ctx.persistFinding?.(finding);

        if (result.passed === false) {
          const gateFinding: UltimateInstructionalFinding = {
            step,
            severity: 'error',
            code: 'STEP_QUALITY_GATE_FAILED',
            message: `${step} returned a failed quality result`,
          };
          ctx.findings.push(gateFinding);
          await ctx.persistFinding?.(gateFinding);
          await ctx.persistStep?.({
            step,
            state: 'failed',
            artifacts,
            findings: [...findings, gateFinding],
          });
          break;
        }

        ctx.passedSteps?.add(step);
        await ctx.persistStep?.({ step, state: 'passed', artifacts, findings });
      } catch (error) {
        const finding: UltimateInstructionalFinding = {
          step,
          severity: 'error',
          code: 'STEP_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
        };
        ctx.findings.push(finding);
        await ctx.persistFinding?.(finding);
        await ctx.persistStep?.({ step, state: 'failed', findings: [finding] });
        break;
      }
    }
    return ctx;
  }
}
