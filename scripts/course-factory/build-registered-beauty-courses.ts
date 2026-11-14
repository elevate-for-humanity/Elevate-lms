// Production certification runner for the registered beauty occupation courses.
// Re-run marker: server/CLI admin-client boundary verified before execution.
import { courseFactory, loadAllBlueprints } from '../../lib/course-factory';
import { requireAdminClient } from '../../lib/supabase/admin';

const AI_SECRET_KEYS = [
  'OPENAI_API_KEY',
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'ANTHROPIC_API_KEY',
  'AZURE_OPENAI_API_KEY',
] as const;

const TARGETS = [
  {
    blueprintId: 'esthetician-indiana-v1',
    programSlug: 'esthetician-apprenticeship',
    expectedModules: 7,
    expectedLessons: 28,
  },
  {
    blueprintId: 'nail-technician-indiana-v1',
    programSlug: 'nail-technician-apprenticeship',
    expectedModules: 7,
    expectedLessons: 26,
  },
] as const;

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
      console.warn(`[registered-beauty] ${key} could not be hydrated from platform secrets: ${error.message}`);
      continue;
    }
    if (typeof data === 'string' && data.trim()) {
      process.env[key] = data.trim();
      available.push(key);
    }
  }

  if (!available.length) {
    throw new Error('No production AI provider credential is available for registered beauty acceptance');
  }

  console.log(`[registered-beauty] AI provider pool hydrated (${available.length} configured provider credential(s))`);
}

async function main() {
  await hydrateProductionAISecrets();
  const blueprints = await loadAllBlueprints();
  const results: unknown[] = [];

  for (const target of TARGETS) {
    const source = blueprints.find((item) => item.id === target.blueprintId);
    if (!source) throw new Error(`Blueprint not found: ${target.blueprintId}`);

    const blueprint = {
      ...source,
      programSlug: target.programSlug,
      expectedModuleCount: target.expectedModules,
      expectedLessonCount: target.expectedLessons,
      generationRules: {
        ...source.generationRules,
        maxTotalLessons: Math.max(
          Number(source.generationRules?.maxTotalLessons ?? 0),
          target.expectedLessons,
        ),
      },
      videoConfig: source.videoConfig
        ? {
            ...source.videoConfig,
            instructorImagePath: '/images/team/instructors/instructor-beauty.jpg',
          }
        : source.videoConfig,
    };

    console.log(`\n=== Building ${target.programSlug} ===`);
    const result = await courseFactory(
      {
        programSlug: target.programSlug,
        blueprint,
        mode: 'refresh',
        contentSource: 'ai',
        videoMode: 'queue',
        videoQueueLimit: null,
      },
      (stage, message, progress) =>
        console.log(`[${target.programSlug}] ${stage} ${progress ?? ''} ${message}`),
    );

    results.push({ target, result });

    if (!result.ok) {
      throw new Error(
        `${target.programSlug} Course Factory failed: ${JSON.stringify(result.errors ?? result.generationFailures ?? result)}`,
      );
    }
    if (result.courseSlug !== target.programSlug) {
      throw new Error(`${target.programSlug} published to unexpected slug ${result.courseSlug}`);
    }
    if ((result.moduleCount ?? 0) !== target.expectedModules) {
      throw new Error(`${target.programSlug} module count ${result.moduleCount} != ${target.expectedModules}`);
    }
    if ((result.lessonCount ?? 0) < target.expectedLessons) {
      throw new Error(`${target.programSlug} lesson count ${result.lessonCount} < ${target.expectedLessons}`);
    }
    if ((result.completionRatio ?? 0) < 1) {
      throw new Error(`${target.programSlug} completion ratio ${result.completionRatio} is below 1`);
    }
  }

  console.log('\nCOURSE_FACTORY_CERTIFICATION_RESULTS');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
