import {
  artifactPayload,
  contractHash,
  currentEvidence,
  stepInputHash,
  validateStepOutput,
  ULTIMATE_LESSON_CONTRACT_VERSION,
  MAX_TARGETED_REPAIRS,
} from './lesson-contract';
import { isDurableExternalBlocker, routeSelectiveRepairs } from './repair-router';
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
    const attempts: Array<{
      failedStep: UltimateBuildStep;
      target: UltimateBuildStep;
      codes: string[];
    }> = [];
    let index = 0;
    while (index < ULTIMATE_BUILD_STEPS.length) {
      const step = ULTIMATE_BUILD_STEPS[index];
      const inputHash = stepInputHash(step, ctx.profile, ctx.artifacts);
      if (ctx.passedSteps?.has(step) && currentEvidence(ctx.artifacts[step], inputHash)) {
        index++;
        continue;
      }
      // A changed input invalidates this stage and every dependent stage.
      for (const dependent of ULTIMATE_BUILD_STEPS.slice(index)) {
        ctx.passedSteps?.delete(dependent);
        delete ctx.artifacts[dependent];
      }
      await ctx.persistStep?.({ step, state: 'running' });
      let failures: UltimateInstructionalFinding[] = [];
      let artifacts: Record<string, unknown> = {};
      try {
        const handler = this.handlers[step];
        if (!handler) throw new Error(`HANDLER_NOT_IMPLEMENTED:${step}`);
        const result = await handler(ctx);
        artifacts = artifactPayload(result.artifacts ?? {});
        if (step === 'selective_repair')
          artifacts = {
            ...artifacts,
            repair: {
              ...(artifacts.repair as object),
              attempts,
              unresolved: Number(
                (artifacts.repair as any)?.unresolved ??
                  ctx.findings.filter((f) => f.severity === 'error').length,
              ),
            },
          };
        const findings = result.findings ?? [];
        failures = findings.filter((f) => f.severity === 'error');
        for (const code of validateStepOutput(step, artifacts))
          failures.push({
            step,
            severity: 'error',
            code,
            message: `${step} is missing required contract evidence: ${code}`,
          });
        if (result.passed === false && !failures.length)
          failures.push({
            step,
            severity: 'error',
            code: 'STEP_QUALITY_GATE_FAILED',
            message: `${step} failed its quality gate`,
          });
        artifacts.contractEvidence = {
          version: ULTIMATE_LESSON_CONTRACT_VERSION,
          inputHash,
          outputHash: contractHash(artifacts),
          passed: failures.length === 0,
          checkedAt: new Date().toISOString(),
        };
        ctx.artifacts[step] = artifacts;
        await ctx.persistArtifact?.({ step, artifacts });
        if (!failures.length) {
          ctx.findings.push(...findings);
          for (const f of findings) await ctx.persistFinding?.(f);
          ctx.passedSteps?.add(step);
          await ctx.persistStep?.({ step, state: 'passed', artifacts, findings });
          index++;
          continue;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures = [{ step, severity: 'error', code: message.split(':')[0], message }];
      }
      await ctx.persistStep?.({ step, state: 'failed', artifacts, findings: failures });
      for (const finding of failures) await ctx.persistFinding?.(finding);
      const route = routeSelectiveRepairs(failures)[0];
      // Retry transient execution failures only; missing sources/licensing/browser
      // evidence are durable blockers and must never be manufactured by a retry.
      const transient = failures.every((f) =>
        /HTTP (429|5\d\d)|timeout|timed out|ECONNRESET|fetch failed/i.test(f.message),
      );
      const durableBlocker = failures.some((f) => isDurableExternalBlocker(f));
      const target = !durableBlocker ? (route?.step ?? (transient ? step : undefined)) : undefined;
      if (target && attempts.length < MAX_TARGETED_REPAIRS) {
        attempts.push({ failedStep: step, target, codes: failures.map((f) => f.code) });
        index = Math.min(index, ULTIMATE_BUILD_STEPS.indexOf(target));
        continue;
      }
      ctx.findings.push(...failures);
      ctx.artifacts.selective_repair = {
        repair: { attempts, unresolved: failures.length, blockedAt: step },
      };
      await ctx.persistArtifact?.({
        step: 'selective_repair',
        artifacts: ctx.artifacts.selective_repair,
      });
      break;
    }
    return ctx;
  }
}
