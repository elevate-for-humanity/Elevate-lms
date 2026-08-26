// Production regeneration runner for canonical Barber and Cosmetology courses.
import { courseFactory } from '../../lib/course-factory';
import { requireAdminClient } from '../../lib/supabase/admin';

const AI_SECRET_KEYS = [
  'OPENAI_API_KEY',
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'ANTHROPIC_API_KEY',
  'AZURE_OPENAI_API_KEY',
] as const;

const TARGETS = ['barber-apprenticeship', 'cosmetology-apprenticeship'] as const;
let failureStage = 'startup';

async function hydrateProductionAISecrets() {
  const db = await requireAdminClient();
  const available: string[] = [];

  for (const key of AI_SECRET_KEYS) {
    if (process.env[key]?.trim()) {
      available.push(key);
      continue;
    }

    const { data, error } = await db.rpc('get_platform_secret', { p_key: key });
    if (error) {
      console.warn(`[course-regeneration] ${key} unavailable: ${error.message}`);
      continue;
    }
    if (typeof data === 'string' && data.trim()) {
      process.env[key] = data.trim();
      available.push(key);
    }
  }

  if (!available.length) {
    throw new Error('No production AI provider credential is available');
  }
  console.log(`[course-regeneration] hydrated ${available.length} AI provider credential(s)`);
}

async function main() {
  failureStage = 'ai-secret-hydration';
  await hydrateProductionAISecrets();

  for (const programSlug of TARGETS) {
    failureStage = `${programSlug}-course-factory`;
    console.log(`\n=== Regenerating ${programSlug} ===`);
    const result = await courseFactory(
      {
        programSlug,
        mode: 'refresh',
        contentSource: 'ai',
        videoMode: 'queue',
      },
      (stage, message, progress) =>
        console.log(`[${programSlug}] ${stage} ${progress ?? ''} ${message}`),
    );

    failureStage = `${programSlug}-validation-${result.status ?? 'unknown'}`;
    if (!result.ok) {
      throw new Error(
        `${programSlug} regeneration failed: ${JSON.stringify(result.errors ?? result.generationFailures ?? result)}`,
      );
    }
    if (result.courseSlug !== programSlug) {
      throw new Error(`${programSlug} persisted to unexpected slug ${result.courseSlug}`);
    }
    if ((result.moduleCount ?? 0) < 1 || (result.lessonCount ?? 0) < 1) {
      throw new Error(
        `${programSlug} persisted incomplete package: ${result.moduleCount ?? 0} modules, ${result.lessonCount ?? 0} lessons`,
      );
    }

    console.log(
      `COURSE_REGENERATION_SUCCESS ${programSlug} ${result.courseId} ${result.moduleCount} ${result.lessonCount}`,
    );
  }
}

main().catch((error) => {
  console.error(`COURSE_REGENERATION_FAILURE_STAGE ${failureStage}`);
  console.error(error);
  process.exit(1);
});
