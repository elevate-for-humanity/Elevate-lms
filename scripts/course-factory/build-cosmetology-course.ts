import { courseFactory } from '../../lib/course-factory';
import { getBlueprintBySlug } from '../../lib/course-factory/blueprint-loader';
import { queueCourseLessonVideos } from '../../lib/course-factory/media-service';
import { publishCourse } from '../../lib/course-factory/publisher';
import { registerProgramCourse } from '../../lib/course-builder/program-resolver';
import { requireAdminClient } from '../../lib/supabase/admin';

const PROGRAM_SLUG = 'cosmetology-apprenticeship';
const COURSE_ID = '9ca9fb50-7119-46ea-ab81-9b0193c29c31';
const EXPECTED_MODULES = 8;
const EXPECTED_LESSONS = 40;
const CONFIG_KEYS = [
  'AI_PROVIDER',
  'AI_PROVIDER_ORDER',
  'ELEVATE_LLM_URL',
  'ELEVATE_LLM_SECRET',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_AI_API_TOKEN',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_AI_MODEL',
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_CLOUD_API_KEY',
  'ANTHROPIC_API_KEY',
  'AZURE_OPENAI_API_KEY',
  'OPENAI_API_KEY',
] as const;

type AdminDb = Awaited<ReturnType<typeof requireAdminClient>>;

function fail(message: string): never {
  throw new Error(`[Cosmetology Course Builder] ${message}`);
}

async function hydrateProductionProvider(db: AdminDb) {
  const available = new Set<string>();
  for (const key of CONFIG_KEYS) {
    if (process.env[key]?.trim()) {
      available.add(key);
      continue;
    }
    const { data, error } = await db.rpc('get_platform_secret', { p_key: key });
    if (!error && typeof data === 'string' && data.trim()) {
      process.env[key] = data.trim();
      available.add(key);
    }
  }

  const elevateReady = available.has('ELEVATE_LLM_URL') && available.has('ELEVATE_LLM_SECRET');
  const cloudflareReady =
    available.has('CLOUDFLARE_ACCOUNT_ID') &&
    (available.has('CLOUDFLARE_AI_API_TOKEN') || available.has('CLOUDFLARE_API_TOKEN'));
  const hostedReady = [
    'GROQ_API_KEY',
    'GEMINI_API_KEY',
    'GOOGLE_CLOUD_API_KEY',
    'ANTHROPIC_API_KEY',
    'AZURE_OPENAI_API_KEY',
    'OPENAI_API_KEY',
  ].some((key) => available.has(key));

  if (!process.env.AI_PROVIDER?.trim()) {
    if (elevateReady) process.env.AI_PROVIDER = 'elevate';
    else if (cloudflareReady) process.env.AI_PROVIDER = 'cloudflare';
  }
  if (!elevateReady && !cloudflareReady && !hostedReady) {
    fail('No complete production AI provider configuration is available');
  }

  console.log(
    `[Cosmetology Course Builder] provider=${process.env.AI_PROVIDER || 'repository-order'}`,
  );
}

function textLength(value: unknown): number {
  if (typeof value === 'string') return value.replace(/<[^>]*>/g, ' ').length;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + textLength(item), 0);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce(
      (sum: number, item) => sum + textLength(item),
      0,
    );
  }
  return 0;
}

async function auditPackage(db: AdminDb, courseId: string) {
  const [{ data: modules, error: moduleError }, { data: lessons, error: lessonError }] =
    await Promise.all([
      db.from('course_modules').select('id,title,domain_key').eq('course_id', courseId),
      db
        .from('course_lessons')
        .select('id,slug,content,content_json,learning_objectives,script,generation_status')
        .eq('course_id', courseId),
    ]);
  if (moduleError) fail(`Module audit failed: ${moduleError.message}`);
  if (lessonError) fail(`Lesson audit failed: ${lessonError.message}`);
  if (modules?.length !== EXPECTED_MODULES)
    fail(`Expected 8 modules; found ${modules?.length ?? 0}`);
  if (lessons?.length !== EXPECTED_LESSONS)
    fail(`Expected 40 lessons; found ${lessons?.length ?? 0}`);

  for (const lesson of lessons ?? []) {
    if (textLength(lesson.content) < 1000)
      fail(`${lesson.slug} has insufficient instructional content`);
    if (!Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length < 3) {
      fail(`${lesson.slug} is missing measurable objectives`);
    }
    if (typeof lesson.script !== 'string' || lesson.script.trim().length < 200) {
      fail(`${lesson.slug} is missing its narration script`);
    }
    if (!lesson.content_json || typeof lesson.content_json !== 'object') {
      fail(`${lesson.slug} is missing its interactive learning experience`);
    }
  }
}

async function main() {
  const db = await requireAdminClient();
  await hydrateProductionProvider(db);

  const blueprint = await getBlueprintBySlug(PROGRAM_SLUG);
  if (!blueprint) fail('Registered cosmetology blueprint was not found');
  if (
    blueprint.expectedModuleCount !== EXPECTED_MODULES ||
    blueprint.expectedLessonCount !== EXPECTED_LESSONS
  ) {
    fail('Registered blueprint is not the approved 8-module/40-lesson structure');
  }

  const [{ data: program, error: programError }, { data: course, error: courseError }] =
    await Promise.all([
      db.from('programs').select('id,slug').eq('slug', PROGRAM_SLUG).maybeSingle(),
      db.from('courses').select('id,program_id,slug').eq('id', COURSE_ID).maybeSingle(),
    ]);
  if (programError || !program?.id)
    fail(`Canonical program lookup failed: ${programError?.message ?? 'missing'}`);
  if (courseError || !course?.id)
    fail(`Canonical course lookup failed: ${courseError?.message ?? 'missing'}`);
  if (course.slug !== PROGRAM_SLUG || course.program_id !== program.id) {
    fail('Canonical course identity does not match the cosmetology program');
  }

  // Persist the approved structure before AI enrichment so lesson-level
  // checkpoints have stable targets and a failed run can resume safely.
  const checkpoint = await publishCourse({
    programId: program.id,
    courseSlug: PROGRAM_SLUG,
    courseTitle: blueprint.title || blueprint.credentialTitle,
    blueprint,
    contentSource: 'blueprint',
    mode: 'refresh',
  });
  if (
    !checkpoint.success ||
    checkpoint.courseId !== COURSE_ID ||
    checkpoint.moduleCount !== EXPECTED_MODULES ||
    checkpoint.lessonCount !== EXPECTED_LESSONS
  ) {
    fail(`Deterministic structure checkpoint failed: ${JSON.stringify(checkpoint.errors)}`);
  }

  const { error: checkpointStateError } = await db
    .from('courses')
    .update({
      status: 'draft',
      is_active: false,
      published_at: null,
      generation_status: 'generating',
      generation_progress: 15,
      total_lessons: EXPECTED_LESSONS,
      review_status: 'draft',
    })
    .eq('id', COURSE_ID);
  if (checkpointStateError) {
    fail(`Structure checkpoint state update failed: ${checkpointStateError.message}`);
  }
  console.log(
    `[Cosmetology Course Builder] checkpoint ready ${COURSE_ID}: ${EXPECTED_MODULES} modules/${EXPECTED_LESSONS} lessons`,
  );

  const result = await courseFactory(
    {
      courseId: COURSE_ID,
      programId: program.id,
      programSlug: PROGRAM_SLUG,
      blueprint,
      mode: 'refresh',
      contentSource: 'ai',
      videoMode: 'queue',
    },
    (stage, message, progress) =>
      console.log(`[Cosmetology Course Builder] ${stage} ${progress ?? ''} ${message}`),
  );
  if (!result.ok || result.courseId !== COURSE_ID) {
    fail(
      `Course Factory failed or changed canonical identity: ${JSON.stringify(result.errors ?? result)}`,
    );
  }
  if (result.moduleCount !== EXPECTED_MODULES || result.lessonCount !== EXPECTED_LESSONS) {
    fail(`Factory returned ${result.moduleCount} modules/${result.lessonCount} lessons`);
  }
  if ((result.generationFailures ?? []).length) {
    fail(`Lesson generation failures: ${JSON.stringify(result.generationFailures)}`);
  }

  await auditPackage(db, COURSE_ID);
  const mapping = await registerProgramCourse(db, PROGRAM_SLUG, COURSE_ID);
  if (!mapping.ok) fail(`Program mapping failed: ${mapping.error}`);

  const media = await queueCourseLessonVideos({
    courseId: COURSE_ID,
    onlyMissing: true,
    force: false,
    limit: null,
  });
  if (media.failed > 0) fail(`${media.failed} media jobs failed to enqueue`);

  const { error: stateError } = await db
    .from('courses')
    .update({
      status: 'draft',
      is_active: false,
      published_at: null,
      generation_status: 'review',
      generation_progress: 90,
      total_lessons: EXPECTED_LESSONS,
      review_status: 'draft',
    })
    .eq('id', COURSE_ID);
  if (stateError) fail(`Final safe-state update failed: ${stateError.message}`);

  console.log('COSMETOLOGY_COURSE_BUILD_READY');
  console.log(
    JSON.stringify(
      {
        courseId: COURSE_ID,
        programId: program.id,
        modules: EXPECTED_MODULES,
        lessons: EXPECTED_LESSONS,
        lessonVideosQueued: media.queued,
        microclipsQueued: media.microclipsQueued,
        dashboardConnection:
          'program_courses registered; active enrollments attach on approved publication',
        publication: 'BLOCKED_PENDING_MEDIA_ACCEPTANCE_AND_HUMAN_REVIEW',
      },
      null,
      2,
    ),
  );
}

main().catch(async (error) => {
  console.error('COSMETOLOGY_COURSE_BUILD_FAILED');
  console.error(error);
  process.exit(1);
});
