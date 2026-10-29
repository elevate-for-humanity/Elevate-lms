import { describeWorkerError } from './worker-error.mjs';
import {repairDirective} from './repair-policy.mjs';
import {
  artifactPayload,
  contractHash,
  currentEvidence,
  stepInputHash,
  stepInputHashes,
  validateStepOutput,
  practicalVisualFailures,
  ULTIMATE_LESSON_CONTRACT_VERSION,
  MAX_TARGETED_REPAIRS,
  nonblockingManualReview,
  optionalManualReviewStage,
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
  assertActive?: () => void;
  repairDirective?: any;
  beforeCheckpoint?: (step: UltimateBuildStep) => Promise<UltimateBuildStep | null>;
  /** Owner preview stops after encoding; it never certifies QA or publication. */
  renderPreviewOnly?: boolean;
  /** Durable role boundary; a partial stage never certifies a full lesson. */
  stopAfterStep?: UltimateBuildStep;
  startAtStep?: UltimateBuildStep;
}

export class UltimateBuildRunner {
  constructor(private handlers: Partial<Record<UltimateBuildStep, StepHandler>>) {}

  async run(ctx: UltimateRunContext) {
    // Keep recovery payloads until a replacement passes validation and is saved.
    // Invalidating a certificate must not destroy the previously saved lesson.
    const retainedCheckpoints = new Map<UltimateBuildStep, Record<string, unknown>>();
    for (const step of ULTIMATE_BUILD_STEPS) {
      const checkpoint = ctx.artifacts[step];
      if (checkpoint) retainedCheckpoints.set(step, structuredClone(checkpoint));
    }
    const attempts: Array<{
      failedStep: UltimateBuildStep;
      target: UltimateBuildStep;
      codes: string[];
    }> = [];
    const savedRepair = (ctx.artifacts as any).__repairState;
    ctx.repairDirective = savedRepair?.status === 'producer-validated' ? undefined : savedRepair?.directive;
    let index = 0;
    while (index < ULTIMATE_BUILD_STEPS.length) {
      if (ctx.stopAfterStep && index > ULTIMATE_BUILD_STEPS.indexOf(ctx.stopAfterStep)) break;
      if (ctx.renderPreviewOnly && index > ULTIMATE_BUILD_STEPS.indexOf('lesson_film_render')) break;
      ctx.assertActive?.();
      const requestedRepair = await ctx.beforeCheckpoint?.(ULTIMATE_BUILD_STEPS[index]);
      if (requestedRepair) {
        index = Math.min(index, ULTIMATE_BUILD_STEPS.indexOf(requestedRepair));
        for (const dependent of ULTIMATE_BUILD_STEPS.slice(index)) {
          ctx.passedSteps?.delete(dependent); delete ctx.artifacts[dependent];
        }
        delete (ctx.artifacts as any).__repairState; ctx.repairDirective = undefined;
        if(index<=ULTIMATE_BUILD_STEPS.indexOf('lesson_film_render')){
          (ctx.artifacts as any).__renderRevision=crypto.randomUUID();
          await ctx.persistArtifact?.({step:'selective_repair',artifacts:{repair:{status:'requested',renderRevision:(ctx.artifacts as any).__renderRevision}}});
        }
      }
      const step = ULTIMATE_BUILD_STEPS[index];
      // Review/browser acceptance is advisory for this specific manual course.
      // Do not fabricate QA artifacts, certificates or browser evidence.
      if (optionalManualReviewStage(step, ctx.profile)) { index++; continue; }
      const inputHash = stepInputHash(step, ctx.profile, ctx.artifacts);
      const competency = ctx.profile.competencies.find(c => ctx.buildId.endsWith(':' + c.id)) ?? ctx.profile.competencies[0];
      if (ctx.repairDirective?.target !== step && ctx.passedSteps?.has(step) && currentEvidence(ctx.artifacts[step], stepInputHashes(step, ctx.profile, ctx.artifacts)) &&
          !validateStepOutput(step, ctx.artifacts[step] ?? {}).length &&
          (step !== 'visual_assignment' || !practicalVisualFailures(ctx.artifacts, competency).length)) {
        index++;
        continue;
      }
      if (ctx.startAtStep && index < ULTIMATE_BUILD_STEPS.indexOf(ctx.startAtStep)) {
        const failure: UltimateInstructionalFinding = {step,severity:'error',code:'AUTOPILOT_UPSTREAM_CHECKPOINT_REQUIRED',message:'AUTOPILOT_UPSTREAM_CHECKPOINT_REQUIRED:'+step};
        // Retain measured producer feedback recovered from durable QA. Replacing
        // it with "checkpoint required" discards the pace correction and loops.
        const directive = ctx.repairDirective?.target === step
          ? ctx.repairDirective : repairDirective([failure],step,step,ctx.artifacts[step],1);
        (ctx.artifacts as any).__repairState = {directive,status:'diagnosed',at:new Date().toISOString()};
        ctx.findings.push(failure);
        await ctx.persistArtifact?.({step:'selective_repair',artifacts:{repair:{directive,unresolved:1}}});
        break;
      }
      // A changed input invalidates this stage and every dependent stage.
      for (const dependent of ULTIMATE_BUILD_STEPS.slice(index)) {
        ctx.passedSteps?.delete(dependent);
        delete ctx.artifacts[dependent];
      }
      ctx.assertActive?.();
      await ctx.persistStep?.({ step, state: 'running' });
      let failures: UltimateInstructionalFinding[] = [];
      let artifacts: Record<string, unknown> = {};
      try {
        const handler = this.handlers[step];
        if (!handler) throw new Error(`HANDLER_NOT_IMPLEMENTED:${step}`);
        ctx.assertActive?.();
        const result = await handler(ctx);
        ctx.assertActive?.();
        artifacts = artifactPayload(result.artifacts ?? {});
        if (step === 'selective_repair')
          artifacts = {
            ...artifacts,
            repair: {
              ...(artifacts.repair as object),
              attempts,
              unresolved: Number(
                (artifacts.repair as any)?.unresolved ?? 0,
              ),
            },
          };
        const findings = result.findings ?? [];
        failures = findings.filter((f) => f.severity === 'error' &&
          !(nonblockingManualReview(ctx.profile) && f.code === 'ULTIMATE_INSTRUCTIONAL_REVIEW_FAILED'));
        // Retain the review finding as a warning, without blocking authoring.
        if (nonblockingManualReview(ctx.profile)) for (const f of findings) {
          if (f.code === 'ULTIMATE_INSTRUCTIONAL_REVIEW_FAILED') f.severity = 'warning';
        }
        const contractFailures = failures.length ? [] : validateStepOutput(step, artifacts);
        if (step === 'visual_assignment') contractFailures.push(...practicalVisualFailures({...ctx.artifacts, visual_assignment: artifacts}, competency));
        for (const code of contractFailures)
          failures.push({
            step,
            severity: 'error',
            code,
            message: `${step} is missing required contract evidence: ${code}`,
          });
        if (result.passed === false && !failures.length &&
          !(nonblockingManualReview(ctx.profile) && findings.some(f => f.code === 'ULTIMATE_INSTRUCTIONAL_REVIEW_FAILED')))
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
        ctx.assertActive?.();
        const isRepairTarget = ctx.repairDirective?.target === step;
        const previous = isRepairTarget ? ctx.repairDirective.previous : undefined;
        const producerRepair = isRepairTarget && step !== 'finished_media_qa' && Boolean(previous);
        // Do not reject a producer solely because its output matches a saved,
        // owner-approved artifact. The ordinary step contract and downstream
        // independent QA remain authoritative; retries are still bounded.
        // A failed repair candidate must not replace a known-good artifact or
        // create a new accepted artifact version. Keep the previous checkpoint
        // available for recovery and record the failed state separately.
        // Do not spend another render on a producer that returned the same
        // defective evidence. Preserve the prior certified artifact, and surface
        // a genuine repair blocker for PARIS rather than marking it corrected.
        // Media QA itself is an inspector, not a producer.
        if (producerRepair && failures.length === 0 &&
            ['synchronization', 'visual_assignment', 'scene_construction', 'natural_narration'].includes(step) &&
            contractHash(Object.fromEntries(Object.entries(artifacts).filter(([key]) => key !== 'contractEvidence'))) ===
            contractHash(Object.fromEntries(Object.entries(previous).filter(([key]) => key !== 'contractEvidence')))) {
          throw new Error('REPAIR_PRODUCER_UNCHANGED:' + step);
        }
        if (producerRepair && failures.length) {
          artifacts = previous;
          ctx.artifacts[step] = previous;
        } else {
          ctx.artifacts[step] = artifacts;
          if (!failures.length) {
            await ctx.persistArtifact?.({ step, artifacts });
            retainedCheckpoints.set(step, structuredClone(artifacts));
          }
        }
        if (!failures.length) {
          if(isRepairTarget){
            (ctx.artifacts as any).__repairState={...(ctx.artifacts as any).__repairState,status:'producer-validated',producerHash:contractHash(artifacts),validatedAt:new Date().toISOString()};
            ctx.repairDirective=undefined;
            await ctx.persistArtifact?.({step:'selective_repair',artifacts:{repair:{...(ctx.artifacts as any).__repairState,unresolved:0}}});
          }
          ctx.findings.push(...findings);
          for (const f of findings) await ctx.persistFinding?.(f);
          ctx.passedSteps?.add(step);
          await ctx.persistStep?.({ step, state: 'passed', artifacts, findings });
          index++;
          continue;
        }
      } catch (error) {
        const message = describeWorkerError(error);
        const code =
          error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string'
            ? (error as any).code
            : message.split(':')[0];
        failures = [{ step, severity: 'error', code, message }];
      }
      // A thrown handler, rejected candidate, or failed save leaves the last
      // durable payload available. Cleared passedSteps stay cleared: recovered
      // media is history, not permission to publish against changed inputs.
      for (const [savedStep, checkpoint] of retainedCheckpoints) {
        if (savedStep === step || ctx.artifacts[savedStep] === undefined)
          ctx.artifacts[savedStep] = structuredClone(checkpoint);
      }
      artifacts = ctx.artifacts[step] ?? artifacts;
      ctx.assertActive?.();
      await ctx.persistStep?.({ step, state: 'failed', artifacts, findings: failures });
      for (const finding of failures) await ctx.persistFinding?.(finding);
      const route = routeSelectiveRepairs(failures)[0];
      // Retry transient execution failures only; missing sources/licensing/browser
      // evidence are durable blockers and must never be manufactured by a retry.
      const transient = failures.every((f) =>
        /HTTP (429|5\d\d)|timeout|timed out|ECONNRESET|fetch failed/i.test(f.message),
      );
      const durableBlocker = failures.some((f) => isDurableExternalBlocker(f));
      const proposedTarget = !durableBlocker ? (route?.step ?? (transient ? step : undefined)) : undefined;
      // A previously validated producer checkpoint must not be invalidated
      // indefinitely for the same downstream finding. A genuine new source
      // revision or explicit checkpoint repair can authorize a fresh attempt;
      // until then, retain the evidence and expose the unresolved QA failure.
      const validatedRepair = (ctx.artifacts as any).__repairState;
      const repeatedValidatedFailure = proposedTarget &&
        validatedRepair?.status === 'producer-validated' &&
        validatedRepair?.directive?.target === proposedTarget &&
        Array.isArray(validatedRepair?.directive?.requirements) &&
        failures.every(f => validatedRepair.directive.requirements.some(
          (previous: any) => previous.code === f.code && previous.message === f.message,
        ));
      const target = repeatedValidatedFailure ? undefined : proposedTarget;
      if (target && attempts.length < MAX_TARGETED_REPAIRS) {
        const previous=ctx.artifacts[target];
        const directive=repairDirective(failures,step,target,previous,attempts.length+1);
        ctx.repairDirective=directive;
        (ctx.artifacts as any).__repairState={directive,status:'diagnosed',at:new Date().toISOString()};
        await ctx.persistArtifact?.({step:'selective_repair',artifacts:{repair:{directive,unresolved:failures.length}}});
        if (ctx.startAtStep && ULTIMATE_BUILD_STEPS.indexOf(target) < ULTIMATE_BUILD_STEPS.indexOf(ctx.startAtStep)) {
          ctx.findings.push(...failures);
          break; // The responsible producer gets its own durable role job.
        }
        attempts.push({ failedStep: step, target, codes: failures.map((f) => f.code) });
        index = Math.min(index, ULTIMATE_BUILD_STEPS.indexOf(target));
        // A routed repair deliberately changes an upstream producer. Its old
        // passed certificate must not cause the loop to skip that producer and
        // merely rerun QA against the identical failed movie.
        for (const dependent of ULTIMATE_BUILD_STEPS.slice(index)) {
          ctx.passedSteps?.delete(dependent);
          delete ctx.artifacts[dependent];
        }
        continue;
      }
      // A completed producer repair belongs only to the failure that requested
      // it. Once a later independent gate fails without a routed producer, do
      // not leave that older directive available for the role coordinator to
      // delegate again. The certified producer checkpoints remain intact; only
      // the obsolete routing instruction is removed.
      if (!target) {
        delete (ctx.artifacts as any).__repairState;
        ctx.repairDirective = undefined;
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
