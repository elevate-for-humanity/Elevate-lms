import { enforceMediaQuality } from '@/lib/video/media-quality-gate';
import { instructionalQualityFailures } from '@/lib/video/instructional-quality-gate';
import { verifyRegisteredProfile } from '../credential/verify-registered-profile';
import type { StepHandler } from './build-runner';
import type { UltimateRuntime } from './runtime';
import { evaluateNarration } from '../quality/narration-quality';
import { analyzeNarrationAudio } from '../quality/narration-audio-analysis';
import { routeSelectiveRepairs } from './repair-router';
import { evaluateLearnerRunthrough } from '../quality/learner-runthrough';
import { auditTraceability, type TraceabilityRow } from '../release/traceability';
import { evaluateAccessibility } from '../accessibility/accessibility-contract';
import { executableRepairTargets, type CourseRepairPlan } from '../repair/course-repair-plan';
import { instructionalDepthFor } from '../instructional/depth-contract';
const comp = (ctx: any) =>
  ctx.profile.competencies.find((c: any) => String(ctx.buildId).endsWith(':' + c.id)) ??
  ctx.profile.competencies[0];
const evidence = (ctx: any) => ({
  profile: ctx.profile,
  competency: comp(ctx),
  instructionalDepth: instructionalDepthFor(comp(ctx)),
  prior: ctx.artifacts,
});
function requireLicensedVisualCoverage(ctx: any, mediaInput?: any) {
  const storyboard =
    (ctx.artifacts.storyboard as any)?.storyboard ?? ctx.artifacts.storyboard ?? {};
  const scenes = Array.isArray(storyboard.scenes) ? storyboard.scenes : [];
  const media =
    mediaInput ??
    (ctx.artifacts.visual_assignment as any)?.media ??
    ctx.artifacts.visual_assignment ??
    {};
  const assignments = Array.isArray(media.assignments) ? media.assignments : [];
  const readyAssets = Array.isArray(media.readyAssets) ? media.readyAssets : [];
  const assetById = new Map(readyAssets.map((asset: any) => [String(asset.id), asset]));
  if (scenes.length !== 13)
    throw new Error(`ULTIMATE_STORYBOARD_13_SCENES_REQUIRED:${scenes.length}:13`);
  if (assignments.length !== scenes.length)
    throw new Error(`ULTIMATE_SCENE_ASSIGNMENT_COVERAGE_REQUIRED:${assignments.length}:${scenes.length}`);
  const sceneIds = new Set(scenes.map((scene: any) => String(scene.id)));
  const assignedSceneIds = new Set(assignments.map((assignment: any) => String(assignment.sceneId)));
  if (assignedSceneIds.size !== scenes.length || [...sceneIds].some((id) => !assignedSceneIds.has(id)))
    throw new Error('ULTIMATE_SCENE_ASSIGNMENT_ONE_TO_ONE_REQUIRED');
  const reuse = new Map<string, number>();
  for (const assignment of assignments) {
    if (!assignment?.assetId || !assignment?.licenseEvidenceUrl || !assignment?.relevanceReason)
      throw new Error('ULTIMATE_VISUAL_LICENSE_RELEVANCE_REQUIRED');
    const asset = assetById.get(String(assignment.assetId)) as any;
    if (!asset?.entitlement_id || !asset?.public_url)
      throw new Error(`ULTIMATE_VISUAL_ASSET_NOT_READY:${assignment.assetId}`);
    const identity = String(asset.provider_item_id ?? asset.entitlement_id);
    reuse.set(identity, (reuse.get(identity) ?? 0) + 1);
  }
  const prohibited = [...reuse.entries()].filter(([, count]) => count > 1);
  if (prohibited.length)
    throw new Error(`ULTIMATE_PROHIBITED_VISUAL_REPETITION:${JSON.stringify(prohibited)}`);
}

function isTransientMediaDiscoveryError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes("unexpected token '<'") ||
    message.includes('is not valid json') ||
    message.includes('fetch failed') ||
    message.includes('network error') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('socket hang up')
  );
}

async function findMediaWithTransientRetry(runtime: UltimateRuntime, request: any) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await runtime.media.find(request);
    } catch (error) {
      lastError = error;
      if (!isTransientMediaDiscoveryError(error) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}

export function createProductionHandlers(runtime: UltimateRuntime): Record<string, StepHandler> {
  return {
    standards_lock: async (ctx) => {
      const registered = /[0-9]{4}[a-z]{2}/i.test(ctx.profile.id);
      const declaredCourseDefined =
        !registered &&
        (ctx.profile.authority === 'course-defined' ||
          ctx.profile.standardVersion === 'course-defined' ||
          ctx.profile.id.startsWith('course:'));
      const credential: any = declaredCourseDefined
        ? { id: ctx.profile.id, status: 'profile-provided-by-build' }
        : await runtime.credential.load(ctx.profile.id);
      const authority = registered ? verifyRegisteredProfile(ctx.profile) : credential;
      const courseDefined =
        !registered &&
        (declaredCourseDefined || credential?.status === 'profile-provided-by-build');
      return {
        artifacts: {
          requirements: {
            mode: registered
              ? 'registered-standard'
              : courseDefined
                ? 'course-defined'
                : 'credential-backed',
            title: ctx.profile.title,
            authority: courseDefined
              ? 'course-build-request'
              : ctx.profile.authority ||
                credential?.name ||
                credential?.issuer ||
                'course-build-request',
            version: ctx.profile.standardVersion || 'course-defined',
            sources: ctx.profile.sourceDocuments ?? [],
            competencies: ctx.profile.competencies ?? [],
          },
          credential: courseDefined ? null : credential,
          authority: courseDefined ? { status: 'course-defined', verified: true } : authority,
          workforce: await runtime.workforce.load({
            socCodes: ctx.profile.socCodes ?? [],
            jurisdiction: ctx.profile.jurisdiction,
            occupationTitle: ctx.profile.title,
          }),
        },
      };
    },
    learning_objectives: async (ctx) => {
      const generator: any = runtime.instructional;
      const blueprint = generator.blueprint ? await generator.blueprint(evidence(ctx)) : undefined;
      return {
        artifacts: {
          objectives: await generator.objectives(evidence(ctx)),
          ...(blueprint ? { blueprint } : {}),
        },
      };
    },
    prerequisites: async (ctx) => ({
      artifacts: { prerequisites: await runtime.instructional.prerequisites(evidence(ctx)) },
    }),
    teaching_sequence: async (ctx) => ({
      artifacts: { sequence: await runtime.instructional.teachingSequence(evidence(ctx)) },
    }),
    instructor_script: async (ctx) => ({
      artifacts: { script: await runtime.instructional.instructorScript(evidence(ctx)) },
    }),
    storyboard: async (ctx) => ({
      artifacts: { storyboard: await runtime.instructional.storyboard(evidence(ctx)) },
    }),
    visual_assignment: async (ctx) => {
      const request = {
        courseId: ctx.courseId,
        profile: ctx.profile,
        competency: comp(ctx),
        storyboard: ctx.artifacts.storyboard,
        artifacts: ctx.artifacts,
      };
      let media;
      try {
        media = await findMediaWithTransientRetry(runtime, request);
        requireLicensedVisualCoverage(ctx, media);
      } catch (error) {
        if (typeof runtime.media.acquire !== 'function') throw error;
        await runtime.media.acquire(request);
        media = await findMediaWithTransientRetry(runtime, request);
        requireLicensedVisualCoverage(ctx, media);
      }
      return { artifacts: { media } };
    },
    scene_construction: async (ctx) => ({
      artifacts: {
        scenes: {
          shots: ((ctx.artifacts.visual_assignment as any)?.media?.assignments ?? []).map(
            (a: any) => ({ ...a, loop: false }),
          ),
          storyboard: ctx.artifacts.storyboard,
          media: ctx.artifacts.visual_assignment,
          loop: false,
        },
      },
    }),
    natural_narration: async (ctx) => {
      requireLicensedVisualCoverage(ctx);
      return {
        artifacts: {
          narration: await runtime.narration.generate({
            lessonId: comp(ctx).id,
            script:
              (ctx.artifacts.instructor_script as any)?.script?.script ??
              (ctx.artifacts.instructor_script as any)?.script ??
              ctx.artifacts.instructor_script,
            artifacts: ctx.artifacts,
            tone: 'neutral-calm',
            targetWpm: 135,
          }),
        },
      };
    },
    synchronization: async (ctx) => {
      let cursor = 3;
      const narration: any = (ctx.artifacts.natural_narration as any)?.narration;
      const segments = narration.segments.map((s: any) => {
        const startSeconds = cursor;
        cursor += Math.max(4, Math.ceil(s.durationSeconds) + 1);
        return {
          ...s,
          startSeconds,
          endSeconds: cursor,
          captions: s.captions.map((cue: any) => ({
            ...cue,
            startSeconds: startSeconds + cue.startSeconds,
            endSeconds: startSeconds + cue.endSeconds,
          })),
        };
      });
      return { artifacts: { timeline: { segments, fps: 30, durationSeconds: cursor + 2 } } };
    },
    active_teaching: async (ctx) => ({
      artifacts: {
        activities: (ctx.artifacts.instructor_script as any)?.script?.activities,
        objectives: ctx.artifacts.learning_objectives,
      },
    }),
    mistakes_and_corrections: async (ctx) => ({
      artifacts: { mistakes: (ctx.artifacts.instructor_script as any)?.script?.mistakes },
    }),
    assessment_alignment: async (ctx) => ({
      artifacts: {
        assessment: await runtime.assessment.generate({
          competency: comp(ctx),
          objectives: ctx.artifacts.learning_objectives,
          learning: ctx.artifacts.active_teaching,
          script: ctx.artifacts.instructor_script,
        }),
      },
    }),
    lesson_film_render: async (ctx) => ({
      artifacts: {
        render: await runtime.renderer.render({
          lessonId: comp(ctx).id,
          courseTitle: ctx.profile.title,
          artifacts: ctx.artifacts,
        }),
      },
    }),
    finished_media_qa: async (ctx) => {
      const render: any = ctx.artifacts.lesson_film_render?.render;
      const script: any = (ctx.artifacts.instructor_script as any)?.script;
      const objectives: any[] = (ctx.artifacts.learning_objectives as any)?.objectives ?? [];
      const quality = instructionalQualityFailures({
        courseTitle: ctx.profile.title,
        lessonTitle: comp(ctx).title,
        lessonType: comp(ctx).type,
        script: script.script,
        learningObjectives: objectives.map((o) => o.text),
        instructor: { id: 'ultimate', title: 'Instructor', specialty: ctx.profile.title },
        storyboard: render.sceneData,
      });
      if (quality.failures.length)
        return {
          passed: false,
          artifacts: { mediaQA: { pass: false, failures: quality.failures } },
        };
      const inspection = await enforceMediaQuality({
        videoUrl: render.videoUrl,
        expectedDurationSeconds: render.duration,
        expectedSceneCount: render.sceneData.scenes.length,
        sceneData: render.sceneData,
        expectedScript: script.script,
        instructionalQuality: quality.evidence,
        provider: render.provider,
        providerModel: render.providerModel,
      });
      return { passed: true, artifacts: { mediaQA: { pass: true, inspection } } };
    },
    instructional_qa: async (ctx) => {
      const inspection: any = (ctx.artifacts.finished_media_qa as any)?.mediaQA?.inspection;
      const objectives: any[] = (ctx.artifacts.learning_objectives as any)?.objectives ?? [];
      const delivered = String(inspection?.actualTranscript ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
      const objectiveEvidence = objectives.map((objective: any) => {
        const terms = String(objective.text ?? '')
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((term) => term.length >= 5);
        const matched = terms.filter((term) => delivered.includes(term));
        const firstMatch = matched
          .map((term) => delivered.indexOf(term))
          .filter((index) => index >= 0)
          .sort((a, b) => a - b)[0];
        const deliveredExcerpt =
          firstMatch === undefined
            ? ''
            : delivered.slice(Math.max(0, firstMatch - 120), firstMatch + 240).trim();
        return {
          objectiveId: objective.id,
          matchedTerms: matched,
          requiredTerms: Math.min(3, Math.max(1, terms.length)),
          deliveredExcerpt,
          pass: matched.length >= Math.min(3, Math.max(1, terms.length)),
        };
      });
      const instructionalQA = {
        pass: objectives.length > 0 && objectiveEvidence.every((e: any) => e.pass),
        objectiveEvidence,
        source: 'deterministic-delivered-transcript-review',
      };
      return { passed: instructionalQA.pass, artifacts: { instructionalQA } };
    },
    narration_qa: async (ctx) => {
      const render: any = ctx.artifacts.lesson_film_render?.render;
      const inspection: any = (ctx.artifacts.finished_media_qa as any)?.mediaQA?.inspection;
      const metrics = await analyzeNarrationAudio({
        audioUrl: render.videoUrl,
        transcript: inspection.actualTranscript,
        deliveredMp4: true,
      });
      const narrationQA = {
        ...evaluateNarration(metrics),
        metrics,
        source: 'delivered-mp4',
        mediaSha256: inspection.mediaSha256,
      };
      return { passed: narrationQA.pass, artifacts: { narrationQA } };
    },
    learner_runthrough: async (ctx) => {
      const render: any = ctx.artifacts.lesson_film_render?.render;
      const learnerRuntimeEvidence = await runtime.learner.verify({
        courseId: ctx.courseId,
        lessonId: String(comp(ctx).id),
        videoUrl: render.videoUrl,
      });
      const results: any = (learnerRuntimeEvidence.evidence as any).results ?? {};
      const learnerQA = { ...evaluateLearnerRunthrough(results), results };
      return { passed: learnerQA.pass, artifacts: { learnerQA, learnerRuntimeEvidence } };
    },
    selective_repair: async (ctx) => {
      const routes = routeSelectiveRepairs(ctx.findings);
      const plan: CourseRepairPlan = {
        buildId: ctx.buildId,
        createdAt: new Date().toISOString(),
        preserveCourseIdentity: true,
        preservePassingArtifacts: true,
        decisions: routes.map((r) => ({
          logicalKey: `stage:${r.step}`,
          owningStage: r.step,
          disposition: 'REPAIR',
          reason: r.codes.join(','),
          locked: false,
          downstreamLogicalKeys: [],
        })),
      };
      return {
        artifacts: {
          repair: {
            plan,
            targets: executableRepairTargets(plan),
            findings: ctx.findings,
            mode: 'failed-components-only',
            rebuildPassingComponents: false,
          },
        },
      };
    },
    credential_release: async (ctx) => {
      const c = comp(ctx);
      const objectives: any[] = (ctx.artifacts.learning_objectives as any)?.objectives ?? [];
      const script: any = (ctx.artifacts.instructor_script as any)?.script;
      const activities: any[] = (ctx.artifacts.active_teaching as any)?.activities ?? [];
      const assessment: any = (ctx.artifacts.assessment_alignment as any)?.assessment;
      const rows: TraceabilityRow[] = objectives.flatMap((o: any) =>
        (o.sourceRequirementIds ?? []).map((r: string) => ({
          requirementId: r,
          competencyId: c.id,
          objectiveId: o.id,
          instructionId: script.segments.find((s: any) => s.objectiveIds.includes(o.id))?.id ?? '',
          demonstrationId:
            script.segments.find(
              (s: any) =>
                s.objectiveIds.includes(o.id) &&
                ['instructor_example', 'demonstration'].includes(s.stage),
            )?.id ?? '',
          guidedPracticeId:
            activities.find(
              (a: any) => a.type === 'guided_practice' && a.objectiveIds.includes(o.id),
            )?.id ?? '',
          independentPracticeId:
            activities.find(
              (a: any) => a.type === 'independent_practice' && a.objectiveIds.includes(o.id),
            )?.id ?? '',
          assessmentIds: assessment.questions
            .filter((q: any) => q.objectiveIds.includes(o.id))
            .map((q: any) => q.id),
          masteryRuleId: `${c.id}:mastery:${assessment.passingScore}`,
        })),
      );
      const traceability = auditTraceability(rows);
      const learnerEvidence: any =
        (ctx.artifacts.learner_runthrough as any)?.learnerRuntimeEvidence?.evidence ?? {};
      const a11y: any = learnerEvidence.accessibility ?? {};
      const accessibility = evaluateAccessibility(a11y);
      const release = {
        courseId: ctx.courseId,
        competencyId: c.id,
        traceability,
        accessibility,
        blocked: !traceability.pass || accessibility.critical,
        rows,
        releaseEvidenceRecorded: true,
      };
      return { passed: !release.blocked, artifacts: { release } };
    },
  };
}
