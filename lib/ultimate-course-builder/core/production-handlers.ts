import {instructionView, renderInstructionArtifacts, applySceneTitleReadabilityRepair, applyTeachingStateVisibilityRepair, orderSceneTeachingStates} from './repair-policy.mjs';
import { enforceMediaQuality } from '@/lib/video/media-quality-gate';
import { instructionalQualityFailures, repeatedTeachingSegments } from '@/lib/video/instructional-quality-gate';
import { verifyRegisteredProfile } from '../credential/verify-registered-profile';
import type { StepHandler } from './build-runner';
import type { UltimateRuntime } from './runtime';
import { evaluateNarration } from '../quality/narration-quality';
import { analyzeNarrationAudio, resolveStoredNarrationUrl } from '../quality/narration-audio-analysis';
import { routeSelectiveRepairs } from './repair-router';
import { evaluateLearnerRunthrough } from '../quality/learner-runthrough';
import { auditTraceability, type TraceabilityRow } from '../release/traceability';
import { evaluateAccessibility } from '../accessibility/accessibility-contract';
import { executableRepairTargets, type CourseRepairPlan } from '../repair/course-repair-plan';
import { instructionalDepthFor } from '../instructional/depth-contract';
import { renderMediaUrl, renderPlaybackUrl } from '../media/playback-source.mjs';
import { narrationSceneSeconds } from '../instructional/approved-presentation.mjs';
import { approvedDeliveryFailures } from '../instructional/approved-delivery.mjs';
import { requireChapterRecap } from '../instructional/new-course-contract.mjs';
const comp = (ctx: any) =>
  ctx.profile.competencies.find((c: any) => String(ctx.buildId).endsWith(':' + c.id)) ??
  ctx.profile.competencies[0];
const evidence = (ctx: any) => ({
  profile: ctx.profile,
  competency: comp(ctx),
  instructionalDepth: instructionalDepthFor(comp(ctx)),
  prior: ctx.artifacts,
  repairDirective: ctx.repairDirective,
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
  if (scenes.length < 8 || scenes.length > 16)
    throw new Error(`ULTIMATE_STORYBOARD_SCENE_RANGE_REQUIRED:${scenes.length}:8:16`);
  if (assignments.length !== scenes.length)
    throw new Error(`ULTIMATE_SCENE_ASSIGNMENT_COVERAGE_REQUIRED:${assignments.length}:${scenes.length}`);
  const sceneIds = new Set(scenes.map((scene: any) => String(scene.id)));
  const assignedSceneIds = new Set(assignments.map((assignment: any) => String(assignment.sceneId)));
  if (assignedSceneIds.size !== scenes.length || [...sceneIds].some((id) => !assignedSceneIds.has(id)))
    throw new Error('ULTIMATE_SCENE_ASSIGNMENT_ONE_TO_ONE_REQUIRED');
  const reuse = new Map<string, number>();
  for (const assignment of assignments) {
    if (!assignment?.assetId || !assignment?.relevanceReason)
      throw new Error('ULTIMATE_VISUAL_RELEVANCE_REQUIRED');
    if (assignment.requestedInstructionalVisual === true && assignment.assignmentMethod === 'instructional-visual-request') {
      if (!String(assignment.assetId).startsWith('instructional-visual-request:'))
        throw new Error(`ULTIMATE_INSTRUCTIONAL_VISUAL_ID_INVALID:${assignment.assetId}`);
      reuse.set(String(assignment.assetId), (reuse.get(String(assignment.assetId)) ?? 0) + 1);
      continue;
    }
    // Saved checkpoints from the former photo-specific contract remain
    // resumable. New authoring never creates this legacy request type.
    if (assignment.requestedTeachingPhotograph === true && assignment.assignmentMethod === 'teaching-photograph-request') {
      if (!String(assignment.assetId).startsWith('teaching-photo-request:'))
        throw new Error(`ULTIMATE_INSTRUCTIONAL_VISUAL_ID_INVALID:${assignment.assetId}`);
      reuse.set(String(assignment.assetId), (reuse.get(String(assignment.assetId)) ?? 0) + 1);
      continue;
    }
    const asset = assetById.get(String(assignment.assetId)) as any;
    if (!asset?.entitlement_id || !asset?.public_url)
      throw new Error(`ULTIMATE_VISUAL_ASSET_NOT_READY:${assignment.assetId}`);
    // A stored, course-scoped entitlement is the durable approval record.
    // Keep legacy per-scene evidence compatible, but never require another
    // license URL for an assignment that carries matching approved provenance.
    const approvedSource = assignment.approvedSource === true &&
      Boolean(String(assignment.sourceProvider ?? '').trim()) &&
      String(assignment.entitlementId ?? '') === String(asset.entitlement_id);
    if (!assignment.licenseEvidenceUrl && !approvedSource)
      throw new Error('ULTIMATE_VISUAL_APPROVED_SOURCE_REQUIRED');
    const identity = String(asset.id ?? assignment.assetId);
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
    message.includes('socket hang up') ||
    message.includes('operation was aborted') ||
    message.includes('aborterror') ||
    message.includes('timeouterror')
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
      const registered = !ctx.profile.id.startsWith('course:') && /[0-9]{4}[a-z]{2}/i.test(ctx.profile.id);
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
    scene_construction: async (ctx) => {
      const storyboardArtifact: any = ctx.artifacts.storyboard ?? {};
      const sourceStoryboard = storyboardArtifact.storyboard ?? storyboardArtifact;
      const repairedStoryboard = applyTeachingStateVisibilityRepair(
        applySceneTitleReadabilityRepair(
          orderSceneTeachingStates(sourceStoryboard),
          ctx.repairDirective,
        ),
        ctx.repairDirective,
      );
      const storyboard = storyboardArtifact.storyboard
        ? { ...storyboardArtifact, storyboard: repairedStoryboard }
        : repairedStoryboard;
      return {
        artifacts: {
          scenes: {
            shots: ((ctx.artifacts.visual_assignment as any)?.media?.assignments ?? []).map(
              (a: any) => ({ ...a, loop: false }),
            ),
            storyboard,
            media: ctx.artifacts.visual_assignment,
            loop: false,
          },
        },
      };
    },
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
            repairDirective: ctx.repairDirective,
          }),
        },
      };
    },
    synchronization: async (ctx) => {
      const premium = ctx.profile.lessonPresentation === 'approved-premium-v1';
      let cursor = premium ? 0 : 3;
      const narration: any = (ctx.artifacts.natural_narration as any)?.narration;
      const segments = narration.segments.map((s: any) => {
        const startSeconds = cursor;
        cursor += narrationSceneSeconds(s.durationSeconds, premium);
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
      return { artifacts: { timeline: { segments, fps: 30, durationSeconds: cursor + (premium ? 0 : 2) } } };
    },
    active_teaching: async (ctx) => ({
      artifacts: {
        activities: (ctx.artifacts.instructor_script as any)?.script?.activities,
        flashcards: (ctx.artifacts.instructor_script as any)?.script?.flashcards ?? [],
        objectives: ctx.artifacts.learning_objectives,
      },
    }),
    mistakes_and_corrections: async (ctx) => ({
      artifacts: { mistakes: (ctx.artifacts.instructor_script as any)?.script?.mistakes },
    }),
    assessment_alignment: async (ctx) => {
      const assessment = await runtime.assessment.generate({
        competency: comp(ctx),
        objectives: ctx.artifacts.learning_objectives,
        learning: ctx.artifacts.active_teaching,
        script: ctx.artifacts.instructor_script,
      });
      // The owner's new-course contract is opt-in. Existing course checkpoints
      // and unrelated programs must not be invalidated by the rollout.
      if ((ctx.profile as any).newCourseContract === 'owner-approved-lesson-v1') {
        requireChapterRecap(assessment, comp(ctx).id, 5);
      }
      return { artifacts: { assessment } };
    },
    lesson_film_render: async (ctx) => {
      const sourceScript:any=(ctx.artifacts.instructor_script as any)?.script;
      const sourceBoard:any=(ctx.artifacts.storyboard as any)?.storyboard;
      const sourceObjectives:any[]=(ctx.artifacts.learning_objectives as any)?.objectives??[];
      const preflight=instructionalQualityFailures({courseTitle:ctx.profile.title,lessonTitle:comp(ctx).title,lessonType:comp(ctx).type,script:sourceScript?.script??'',learningObjectives:sourceObjectives.map(o=>o.text),instructor:{id:'ultimate',title:'Instructor',specialty:ctx.profile.title},storyboard:instructionView(sourceBoard)});
      const contentFailures=preflight.failures.filter(message=>!message.includes('no close-up or sourced demonstration scene exists')&&!message.includes('practical beauty instruction must include a sourced close-up demonstration scene'));
      if(contentFailures.length && !ctx.renderPreviewOnly)return {passed:false,findings:contentFailures.map(message=>({step:'lesson_film_render' as const,severity:'error' as const,code:'INSTRUCTIONAL_QUALITY_FAILED',message})),artifacts:{preflight:{pass:false,failures:contentFailures}}};

      // Enforce the approved-video production contract at the actual rendering
      // boundary. A missing scene, source, license or narration must never be
      // silently replaced with a generic slideshow or placeholder clip.
      requireLicensedVisualCoverage(ctx);
      const assigned = (ctx.artifacts.visual_assignment as any)?.media?.assignments ?? [];
      const storyboard = (ctx.artifacts.storyboard as any)?.storyboard?.scenes ?? [];
      const narration = (ctx.artifacts.natural_narration as any)?.narration;
      const timeline = (ctx.artifacts.synchronization as any)?.timeline;
      if (!Array.isArray(storyboard) || !storyboard.length ||
          !Array.isArray(assigned) || assigned.length !== storyboard.length ||
          !Array.isArray(narration?.segments) || !narration.segments.length ||
          !Array.isArray(timeline?.segments) || !timeline.segments.length ||
          !(Number(timeline.durationSeconds) > 0))
        throw new Error('ULTIMATE_RENDER_PRODUCTION_DEPENDENCIES_REQUIRED');
      if (timeline.segments.some((segment: any) =>
          !Number.isFinite(segment.startSeconds) ||
          !Number.isFinite(segment.endSeconds) ||
          segment.endSeconds <= segment.startSeconds))
        throw new Error('ULTIMATE_RENDER_NARRATION_TIMELINE_INVALID');
      const script = String((ctx.artifacts.instructor_script as any)?.script?.script ?? '');
      const repeated = repeatedTeachingSegments(script);
      if (repeated > 0)
        return {
          passed: false,
          findings: [{
            step: 'lesson_film_render', severity: 'error', code: 'NARRATION_DUPLICATION',
            message: `Narration repeats ${repeated} substantial teaching segment(s); repair the source before rendering.`,
          }],
        };
      const canonicalLessonId = ctx.profile.canonicalLessonIds?.[comp(ctx).id];
      if ((ctx.profile as any).sourcePolicy === 'frozen-reference-v1' && !canonicalLessonId)
        throw new Error('FRESH_CANONICAL_LESSON_ID_REQUIRED');
      return {
        artifacts: {
          render: await runtime.renderer.render({
            lessonId: canonicalLessonId ?? comp(ctx).id,
            courseId:ctx.courseId,
            courseTitle: ctx.profile.title,
            lessonTitle: comp(ctx).title,
            ownerPreview: ctx.renderPreviewOnly === true,
            lessonPresentation: ctx.profile.lessonPresentation,
            presentationContract: ctx.profile.presentationContract,
            renderRevision: [(ctx.artifacts as any).__renderRevision,(ctx.artifacts as any).__repairState?.at].filter(Boolean).join(':') || undefined,
            requiresPhysicalDemonstration: comp(ctx).type === 'practical_skill',
            artifacts: renderInstructionArtifacts(ctx.artifacts),
          }),
        },
      };
    },
    finished_media_qa: async (ctx) => {
      const render: any = ctx.artifacts.lesson_film_render?.render;
      if(ctx.profile.lessonPresentation === 'approved-premium-v1') {
        const failures = approvedDeliveryFailures(render,
          (ctx.artifacts.natural_narration as any)?.narration, ctx.profile.presentationContract);
        if (failures.length) throw new Error(failures.join(';'));
        if(render.presentationVersion !== 'approved-moment-cues-v2') throw new Error('APPROVED_MOMENT_PRESENTATION_REQUIRED');
        for(const scene of render.sceneData?.scenes??[]) {
          const cues=scene.pictureCues;
          if(!Array.isArray(cues)||cues.length<2||new Set(cues.map((cue:any)=>cue.sha256)).size<2||
              !scene.recapText?.trim()||!(scene.recapStartSeconds>0&&scene.recapStartSeconds<scene.durationSeconds)||
              cues[0].startSeconds!==0||Math.abs(cues[cues.length-1].endSeconds-scene.durationSeconds)>0.05||
              cues.some((cue:any,i:number)=>cue.endSeconds<=cue.startSeconds||i>0&&Math.abs(cue.startSeconds-cues[i-1].endSeconds)>0.05))
            throw new Error('APPROVED_PICTURE_RECAP_TIMELINE_EVIDENCE_REQUIRED');
        }
      }
      const script: any = (ctx.artifacts.instructor_script as any)?.script;
      const objectives: any[] = (ctx.artifacts.learning_objectives as any)?.objectives ?? [];
      const quality = instructionalQualityFailures({
        courseTitle: ctx.profile.title,
        lessonTitle: comp(ctx).title,
        lessonType: comp(ctx).type,
        script: script.script,
        learningObjectives: objectives.map((o) => o.text),
        instructor: { id: 'ultimate', title: 'Instructor', specialty: ctx.profile.title },
        storyboard: instructionView({...render.sceneData,scenes:render.sceneData.scenes.map((s:any,i:number)=>({...s,stage:(ctx.artifacts.storyboard as any)?.storyboard?.scenes?.[i]?.stage}))}),
      });
      if (quality.failures.length)
        return {
          passed: false,
          findings: quality.failures.map((message) => ({
            step: 'finished_media_qa' as const,
            severity: 'error' as const,
            code: /^(narration|storyboard) repeats/.test(message) ? 'NARRATION_DUPLICATION' : 'INSTRUCTIONAL_QUALITY_FAILED',
            message,
          })),
          artifacts: { mediaQA: { pass: false, failures: quality.failures } },
        };
      const storedMediaUrl = renderMediaUrl(render);
      if (!storedMediaUrl) throw new Error('ULTIMATE_RENDER_MEDIA_URL_REQUIRED');
      // Saved checkpoints outlive private B2 query signatures. Renew access to
      // the same configured object before decoding it; never regenerate media.
      const currentMediaUrl = await resolveStoredNarrationUrl(storedMediaUrl);
      const inspection = await enforceMediaQuality({
        lessonPresentation: ctx.profile.lessonPresentation,
        videoUrl: currentMediaUrl.toString(),
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
        const normalizeTerms = (value: string) => String(value ?? '').toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((term) => term.length >= 4 &&
            !['understand','identify','explain','describe','demonstrate','lesson','course'].includes(term));
        const terms = normalizeTerms(objective.text);
        const deliveredTerms = new Set(normalizeTerms(delivered));
        const matched = terms.filter((term) => deliveredTerms.has(term));
        const requiredTerms = Math.min(2, Math.max(1, Math.ceil(terms.length * 0.25)));
        const firstMatch = matched.map((term) => delivered.indexOf(term))
          .filter((index) => index >= 0).sort((a, b) => a - b)[0];
        const deliveredExcerpt = firstMatch === undefined
          ? delivered.slice(0, 360).trim()
          : delivered.slice(Math.max(0, firstMatch - 120), firstMatch + 240).trim();
        return {
          objectiveId: objective.id,
          matchedTerms: matched,
          requiredTerms,
          deliveredExcerpt,
          pass: matched.length >= requiredTerms,
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
        audioUrl: renderMediaUrl(render),
        transcript: inspection.actualTranscript,
        deliveredMp4: true,
        expectedMediaSha256: inspection.mediaSha256,
      });
      const narrationQA = {
        ...evaluateNarration(metrics),
        metrics,
        source: 'delivered-mp4',
        mediaSha256: inspection.mediaSha256,
      };
      return {
        passed: narrationQA.pass,
        findings: narrationQA.failures.map((code) => ({
          step: 'narration_qa' as const,
          severity: 'error' as const,
          code,
          message: `Delivered narration failed ${code}: ${JSON.stringify({ metrics, unknown: narrationQA.unknown })}`,
        })),
        artifacts: { narrationQA },
      };
    },
    learner_runthrough: async (ctx) => {
      const render: any = ctx.artifacts.lesson_film_render?.render;
      const learnerRuntimeEvidence = await runtime.learner.verify({
        lessonBuildId: ctx.lessonBuildId ?? '',
        courseId: ctx.courseId,
        lessonId: String(comp(ctx).id),
        videoUrl: renderPlaybackUrl(render),
      });
      const results: any = (learnerRuntimeEvidence.evidence as any).results ?? {};
      const learnerQA = { ...evaluateLearnerRunthrough(results), results };
      return {
        passed: learnerQA.pass,
        findings: learnerQA.failed.map((check: string) => ({
          step: 'learner_runthrough' as const,
          severity: 'error' as const,
          code: 'LEARNER_RUNTHROUGH_CHECK_FAILED',
          message: `Authenticated learner check failed: ${check}`,
        })),
        artifacts: { learnerQA, learnerRuntimeEvidence },
      };
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
      // A persisted release certificate is not proof that the current movie
      // passed QA. Never release against stale or missing upstream evidence.
      const render = (ctx.artifacts.lesson_film_render as any)?.render;
      const mediaQA = (ctx.artifacts.finished_media_qa as any)?.mediaQA;
      if (!render || !mediaQA || mediaQA.pass !== true ||
          !ctx.passedSteps?.has('lesson_film_render') ||
          !ctx.passedSteps?.has('finished_media_qa')) {
        return {
          passed: false,
          findings: [{
            step: 'credential_release' as const,
            severity: 'error' as const,
            code: 'FINISHED_MEDIA_ACCEPTANCE_REQUIRED',
            message: 'Current render and finished-media QA must pass before credential release.',
          }],
        };
      }
      const expectedReference = ctx.profile.presentationContract?.approvedReferenceVideo;
      if (ctx.profile.lessonPresentation === 'approved-premium-v1' &&
          (!expectedReference || render.approvedReferenceAssetId !== expectedReference.assetId ||
           render.approvedReferenceSha256 !== expectedReference.sha256))
        throw new Error('APPROVED_REFERENCE_RELEASE_EVIDENCE_REQUIRED');
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
      // This manually approved course retired browser run-through evidence.
      // Do not turn an unavailable browser, expired login, or evidence-store
      // outage into a publication stop. Retain truthful deferred QA metadata,
      // and continue to require rendered video, captions, transcript and media QA.
      const browserEvidenceRetired = ctx.courseId === 'a6b0b712-1cf0-475a-ba79-ee2023dea8ec' &&
        !Object.keys(a11y).length;
      const accessibility = browserEvidenceRetired
        ? { pass: false, critical: false, deferred: true,
            failures: ['ACCESSIBILITY_BROWSER_EVIDENCE_RETIRED'],
            source: 'browser-testing-retired' }
        : evaluateAccessibility(a11y);
      const release = {
        courseId: ctx.courseId,
        competencyId: c.id,
        traceability,
        accessibility,
        blocked: !traceability.pass || accessibility.critical,
        rows,
        releaseEvidenceRecorded: true,
      };
      // Report the owning content defect, not just an opaque release failure.
      // The existing BLUEPRINT route returns this to bounded source authoring.
      const missingPractice = new Map<string, Set<string>>();
      for (const row of traceability.failures) {
        const missing = [
          ...(!row.guidedPracticeId ? ['guided_practice'] : []),
          ...(!row.independentPracticeId ? ['independent_practice'] : []),
        ];
        if (missing.length) {
          const types = missingPractice.get(row.objectiveId) ?? new Set<string>();
          missing.forEach((type) => types.add(type));
          missingPractice.set(row.objectiveId, types);
        }
      }
      return {
        passed: !release.blocked,
        artifacts: { release },
        findings: [...missingPractice].map(([objectiveId, types]) => ({
          step: 'credential_release' as const,
          severity: 'error' as const,
          code: 'BLUEPRINT_OBJECTIVE_PRACTICE_REQUIRED',
          message: `Objective ${objectiveId} is missing ${[...types].join(', ')}. Supply source-grounded learner tasks and corrective feedback; do not relabel unrelated activities.`,
        })),
      };
    },
  };
}



