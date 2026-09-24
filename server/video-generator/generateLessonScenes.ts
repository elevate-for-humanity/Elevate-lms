import { aiChat } from '@/lib/ai/ai-service';
import { LessonRenderPlanDraftSchema } from './schema';
import { SCENE_GENERATION_SYSTEM_PROMPT, buildSceneGenerationUserPrompt } from './prompts';
import { resolveInstructionalDomainProfile } from './domain-profiles';
import type { LessonRenderPlanDraft } from './types';

const MAX_ATTEMPTS = 3;
const SCENE_ATTEMPT_TIMEOUT_MS = 45_000;

async function withSceneAttemptTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Scene generation timed out after ${SCENE_ATTEMPT_TIMEOUT_MS}ms`)),
          SCENE_ATTEMPT_TIMEOUT_MS,
        );
        timer.unref?.();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isPracticalBeautyInstruction(input: {
  domainKey: string;
  title: string;
  content: string;
  lessonType?: string;
  requiresPracticalEvidence?: boolean;
}): boolean {
  if (input.requiresPracticalEvidence) return true;
  if (/\b(lab|practical|procedure|hands-on)\b/i.test(input.lessonType ?? '')) return true;
  if (!['barbering', 'cosmetology', 'esthetics', 'nail_technology'].includes(input.domainKey)) {
    return false;
  }
  if (/\b(checkpoint|quiz|exam|assessment|review)\b/i.test(`${input.lessonType ?? ''} ${input.title}`)) {
    return false;
  }
  return /\b(cut|cutting|clipper|shear|razor|shav|fade|styling|updo|blow[- ]?dry|thermal|curling|flat iron|color(?:ing)?|chemical|relax|perm|sanit|disinfect|drape|facial|manicur|nail|procedure|practical|hands-on)\b/i.test(
    `${input.title} ${input.content}`,
  );
}

/**
 * The production MediaStoryboard vocabulary intentionally uses a smaller set of
 * scene types than the scene-generation schema. Preserve the practical meaning
 * at that boundary so sanitation and critical close-ups cannot collapse into a
 * generic theory arc before the instructional quality gate evaluates them.
 */
function normalizePracticalBeautyPlan(
  plan: LessonRenderPlanDraft,
  practicalBeautyInstruction: boolean,
): LessonRenderPlanDraft {
  if (!practicalBeautyInstruction) return plan;

  let closeupAssigned = false;
  return {
    ...plan,
    scenes: plan.scenes.map((scene) => {
      const sanitationScene = scene.sceneType === 'sanitation_check';
      const criticalCloseup = scene.sceneType === 'critical_closeup';
      const procedureCloseup = !closeupAssigned && scene.sceneType === 'procedure_step';
      if (criticalCloseup || procedureCloseup) closeupAssigned = true;

      return {
        ...scene,
        // MediaDirector understands safety_warning/equipment_closeup and the
        // quality gate consumes those exact semantic scene types.
        sceneType: sanitationScene
          ? 'safety_warning'
          : criticalCloseup
            ? 'equipment_closeup'
            : scene.sceneType,
        // generatedSceneData derives shot size from visualFocus. Make the
        // requested close-up explicit instead of relying on model wording.
        visualFocus:
          criticalCloseup || procedureCloseup
            ? `Close-up: ${scene.visualFocus ?? scene.demonstrationStep}`
            : scene.visualFocus,
      };
    }),
  };
}

export async function generateLessonScenes(opts: {
  lessonId: string;
  title: string;
  content: string;
  domainKey?: string | null;
  seed?: string;
  occupationTitle?: string;
  dolCompetencyId?: string | null;
  dolCompetencyDescription?: string | null;
  rtiRequirement?: string | null;
  rtiHours?: number | null;
  stateAuthority?: string | null;
  stateStandardVersion?: string | null;
  stateRequirement?: string | null;
  examDomain?: string | null;
  passingScore?: number | null;
  requiresPracticalEvidence?: boolean;
  lessonType?: string;
}): Promise<LessonRenderPlanDraft> {
  const plainContent = stripHtml(opts.content);
  const seed = opts.seed ?? `${opts.lessonId}-${Date.now()}`;
  const profile = resolveInstructionalDomainProfile(opts.domainKey);
  const practicalBeautyInstruction = isPracticalBeautyInstruction({
    domainKey: profile.key,
    title: opts.title,
    content: plainContent,
    lessonType: opts.lessonType,
    requiresPracticalEvidence: opts.requiresPracticalEvidence,
  });
  const requiresPracticalEvidence = opts.requiresPracticalEvidence || practicalBeautyInstruction;

  const userPrompt = buildSceneGenerationUserPrompt({
    lessonId: opts.lessonId,
    title: opts.title,
    content: plainContent,
    seed,
    profile,
    occupationTitle: opts.occupationTitle,
    dolCompetencyId: opts.dolCompetencyId,
    dolCompetencyDescription: opts.dolCompetencyDescription,
    rtiRequirement: opts.rtiRequirement,
    rtiHours: opts.rtiHours,
    stateAuthority: opts.stateAuthority,
    stateStandardVersion: opts.stateStandardVersion,
    stateRequirement: opts.stateRequirement,
    examDomain: opts.examDomain,
    passingScore: opts.passingScore,
    requiresPracticalEvidence,
    lessonType: opts.lessonType ?? (requiresPracticalEvidence ? 'procedure' : 'theory'),
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let res;
    try {
      res = await withSceneAttemptTimeout(
        aiChat({
          messages: [
            { role: 'system', content: SCENE_GENERATION_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          maxTokens: 4000,
        }),
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`  ⚠ Attempt ${attempt + 1} provider error: ${lastError.message}`);
      // A timeout is an availability failure, not a content-quality retry. Let
      // the caller use its deterministic storyboard immediately.
      if (lastError.message.includes('timed out')) break;
      continue;
    }

    const raw = res.content ?? '';
    const cleaned = raw
      .replace(/^```json?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      const result = LessonRenderPlanDraftSchema.safeParse(parsed);
      if (result.success) {
        return normalizePracticalBeautyPlan(result.data, practicalBeautyInstruction);
      }
      lastError = new Error(
        `Schema validation failed: ${JSON.stringify(result.error.issues.slice(0, 3))}`,
      );
      console.warn(`  ⚠ Attempt ${attempt + 1} schema error: ${lastError.message}`);
    } catch (e) {
      lastError = new Error(`JSON parse failed: ${e}`);
      console.warn(`  ⚠ Attempt ${attempt + 1} parse error`);
    }
  }

  throw lastError ?? new Error('generateLessonScenes: all attempts failed');
}
