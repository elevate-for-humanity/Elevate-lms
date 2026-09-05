import { randomUUID } from 'node:crypto';

import { courseFactory } from '../../lib/course-factory';
import { getBlueprintBySlug } from '../../lib/course-factory/blueprint-loader';
import { queueCourseLessonVideos } from '../../lib/course-factory/media-service';
import { publishCourse } from '../../lib/course-factory/publisher';
import { registerProgramCourse } from '../../lib/course-builder/program-resolver';
import { repairPersistedLessonObjectives } from '../../lib/course-factory/generation-checkpoints';
import { requireAdminClient } from '../../lib/supabase/admin';

const PROGRAM_SLUG = 'cosmetology-apprenticeship';
const COURSE_ID = '9ca9fb50-7119-46ea-ab81-9b0193c29c31';
const CANONICAL_SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const EXPECTED_MODULES = 8;
const EXPECTED_LESSONS = 40;
const ABANDONED_JOB_AGE_MS = 6 * 60 * 60 * 1000;
const JOB_ID = process.env.GITHUB_RUN_ID
  ? `cosmetology-production-${process.env.GITHUB_RUN_ID}`
  : `cosmetology-production-${randomUUID()}`;
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

type DbResult<T> = { data: T | null; error: { message: string } | null };

function fail(message: string): never {
  throw new Error(`[Cosmetology Course Builder] ${message}`);
}

function pinCanonicalDatabaseTarget(): void {
  process.env.SUPABASE_URL = CANONICAL_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = CANONICAL_SUPABASE_URL;
  console.log('[Cosmetology Course Builder] database-project=cuxzzpsyufcewtmicszk');
}

function isTransientDatabaseError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /abort|circuit|fetch|network|timeout|timed out|502|503|504/i.test(message);
}

async function requiredDbOperation<T>(
  label: string,
  operation: () => PromiseLike<DbResult<T>>,
): Promise<DbResult<T>> {
  const delays = [2_000, 5_000, 16_000];
  let last: DbResult<T> = { data: null, error: { message: `${label} did not run` } };

  for (let attempt = 1; attempt <= delays.length + 1; attempt += 1) {
    try {
      last = await operation();
    } catch (error) {
      last = {
        data: null,
        error: { message: error instanceof Error ? error.message : String(error) },
      };
    }
    if (!last.error) return last;
    if (!isTransientDatabaseError(last.error.message) || attempt > delays.length) return last;

    const delay = delays[attempt - 1];
    console.warn(
      `[Cosmetology Course Builder] ${label} transient failure ${attempt}/${delays.length + 1}; retrying in ${delay}ms: ${last.error.message}`,
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return last;
}

async function hydrateProductionProvider(db: AdminDb) {
  const available = new Set<string>();
  for (const key of CONFIG_KEYS) {
    if (process.env[key]?.trim()) available.add(key);
  }

  const configuredElevate =
    available.has('ELEVATE_LLM_URL') && available.has('ELEVATE_LLM_SECRET');
  if (configuredElevate) {
    if (!process.env.AI_PROVIDER?.trim()) process.env.AI_PROVIDER = 'elevate';
    console.log('[Cosmetology Course Builder] provider=elevate');
    return;
  }

  for (const key of CONFIG_KEYS) {
    if (available.has(key)) continue;
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
        .select(
          'id,slug,content,content_json,learning_objectives,script,quiz_questions,generation_status',
        )
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
    const isCheckpoint = lesson.slug.includes('checkpoint');
    const isFinalExam = lesson.slug === 'cosmo-final-exam';
    const questionCount = Array.isArray(lesson.quiz_questions) ? lesson.quiz_questions.length : 0;
    if (isCheckpoint && questionCount < 10) {
      fail(`${lesson.slug} has ${questionCount}/10 required checkpoint questions`);
    }
    if (isFinalExam && questionCount !== 25) {
      fail(`${lesson.slug} has ${questionCount}/25 required final-exam questions`);
    }
  }
}

async function updateJob(db: AdminDb, patch: Record<string, unknown>) {
  const { error } = await db.from('course_factory_jobs').upsert(
    {
      job_id: JOB_ID,
      credential_slug: PROGRAM_SLUG,
      credential_name: 'Indiana Cosmetology License',
      metadata: {
        course_id: COURSE_ID,
        source: 'production-workflow',
        github_run_id: process.env.GITHUB_RUN_ID ?? null,
        github_run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
        last_heartbeat_at: new Date().toISOString(),
      },
      ...patch,
    },
    { onConflict: 'job_id' },
  );
  if (error) {
    console.warn(
      `[Cosmetology Course Builder] job ledger unavailable; continuing because telemetry cannot block canonical lesson generation: ${error.message}`,
    );
  }
}

async function githubRunHasStopped(runId: string): Promise<boolean | null> {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository || !/^\d+$/.test(runId)) return null;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/actions/runs/${runId}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'elevate-cosmetology-course-builder',
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      console.warn(
        `[Cosmetology Course Builder] could not verify workflow ${runId}: HTTP ${response.status}`,
      );
      return null;
    }

    const run = (await response.json()) as {
      status?: string;
      conclusion?: string | null;
    };
    return run.status === 'completed' || Boolean(run.conclusion);
  } catch (error) {
    console.warn(
      `[Cosmetology Course Builder] could not verify workflow ${runId}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

async function reconcileAbandonedJobs(db: AdminDb) {
  const { data: runningJobs, error } = await requiredDbOperation(
    'abandoned Course Factory job lookup',
    () =>
      db
        .from('course_factory_jobs')
        .select('id,job_id,status,stage,started_at,completed_at,metadata')
        .eq('credential_slug', PROGRAM_SLUG)
        .eq('status', 'running')
        .neq('job_id', JOB_ID),
  );
  if (error) fail(`Abandoned job lookup failed: ${error.message}`);

  const now = Date.now();
  for (const job of runningJobs ?? []) {
    const startedAt =
      typeof job.started_at === 'string' ? Date.parse(job.started_at) : Number.NaN;
    const heartbeat =
      job.metadata &&
      typeof job.metadata === 'object' &&
      typeof (job.metadata as Record<string, unknown>).last_heartbeat_at === 'string'
        ? Date.parse(
            (job.metadata as Record<string, string>).last_heartbeat_at,
          )
        : Number.NaN;
    const lastActivity = Number.isFinite(heartbeat) ? heartbeat : startedAt;
    const priorRunId =
      job.metadata &&
      typeof job.metadata === 'object' &&
      typeof (job.metadata as Record<string, unknown>).github_run_id === 'string'
        ? (job.metadata as Record<string, string>).github_run_id
        : null;
    const priorRunStopped = priorRunId
      ? await githubRunHasStopped(priorRunId)
      : null;
    const abandoned =
      Boolean(job.completed_at) ||
      priorRunStopped === true ||
      !Number.isFinite(lastActivity) ||
      now - lastActivity >= ABANDONED_JOB_AGE_MS;
    if (!abandoned) {
      fail(
        `Another Cosmetology production job is active: ${job.job_id}. Refusing a duplicate run.`,
      );
    }

    const completedAt =
      typeof job.completed_at === 'string'
        ? job.completed_at
        : new Date().toISOString();
    const { error: reconcileError } = await db
      .from('course_factory_jobs')
      .update({
        status: 'failed',
        stage: 'failed',
        message:
          'Abandoned production attempt reconciled before a new canonical run.',
        error:
          'The previous workflow stopped without a terminal ledger update; valid checkpoints remain resumable.',
        completed_at: completedAt,
      })
      .eq('id', job.id)
      .eq('status', 'running');
    if (reconcileError) {
      fail(`Could not reconcile abandoned job ${job.job_id}: ${reconcileError.message}`);
    }
    console.warn(
      `[Cosmetology Course Builder] reconciled abandoned job ${job.job_id}`,
    );
  }
}

async function main() {
  pinCanonicalDatabaseTarget();
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

  // Run required reads sequentially. Parallel failures amplify load and can
  // trip shared infrastructure protection during a transient regional event.
  const { data: program, error: programError } = await requiredDbOperation(
    'canonical program lookup',
    () => db.from('programs').select('id,slug').eq('slug', PROGRAM_SLUG).maybeSingle(),
  );
  if (programError || !program?.id)
    fail(`Canonical program lookup failed: ${programError?.message ?? 'missing'}`);
  const { data: course, error: courseError } = await requiredDbOperation(
    'canonical course lookup',
    () => db.from('courses').select('id,program_id,slug').eq('id', COURSE_ID).maybeSingle(),
  );
  if (courseError || !course?.id)
    fail(`Canonical course lookup failed: ${courseError?.message ?? 'missing'}`);
  if (course.slug !== PROGRAM_SLUG || course.program_id !== program.id) {
    fail('Canonical course identity does not match the cosmetology program');
  }

  await reconcileAbandonedJobs(db);

  // Telemetry starts only after the zero-cost database and identity preflight.
  await updateJob(db, {
    status: 'running',
    stage: 'initializing',
    progress: 1,
    message: 'Canonical database preflight passed; resolving resumable checkpoints.',
    started_at: new Date().toISOString(),
    error: null,
  });

  // Persist the approved structure before AI enrichment so lesson-level
  // checkpoints have stable targets and a failed run can resume safely.
  const checkpoint = await publishCourse({
    programId: program.id,
    courseSlug: PROGRAM_SLUG,
    courseTitle: blueprint.title || blueprint.credentialTitle,
    blueprint,
    contentSource: 'blueprint',
    mode: 'missing-only',
  });
  if (
    !checkpoint.success ||
    checkpoint.courseId !== COURSE_ID ||
    checkpoint.moduleCount !== EXPECTED_MODULES ||
    checkpoint.lessonCount + checkpoint.skippedCount !== EXPECTED_LESSONS
  ) {
    fail(
      `Deterministic structure checkpoint failed: ${JSON.stringify({ errors: checkpoint.errors, modules: checkpoint.moduleCount, insertedLessons: checkpoint.lessonCount, preservedLessons: checkpoint.skippedCount })}`,
    );
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
  await updateJob(db, {
    status: 'running',
    stage: 'generating',
    progress: 15,
    message: 'Canonical structure verified; enriching only incomplete lessons.',
  });
  console.log(
    `[Cosmetology Course Builder] checkpoint ready ${COURSE_ID}: ${EXPECTED_MODULES} modules/${EXPECTED_LESSONS} lessons`,
  );

  const repairedObjectives = await repairPersistedLessonObjectives(COURSE_ID);
  if (repairedObjectives > 0) {
    console.log(
      `[Cosmetology Course Builder] repaired ${repairedObjectives} persisted lesson objective checkpoints`,
    );
  }

  // The production database is the durable checkpoint. A runner timeout can
  // prevent actions/cache from saving even though every lesson was committed.
  // Reuse the persisted package only after the same strict audit used before
  // media generation; otherwise continue through normal AI enrichment.
  let persistedPackageReady = false;
  try {
    await auditPackage(db, COURSE_ID);
    persistedPackageReady = true;
    console.log(
      '[Cosmetology Course Builder] complete persisted package passed audit; skipping redundant AI regeneration',
    );
  } catch (error) {
    console.log(
      `[Cosmetology Course Builder] persisted package requires enrichment: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!persistedPackageReady) {
    const result = await courseFactory(
      {
        courseId: COURSE_ID,
        programId: program.id,
        programSlug: PROGRAM_SLUG,
        blueprint,
        mode: 'refresh',
        contentSource: 'ai',
        // Media is queued once, after the package audit. This prevents GPU work
        // from starting for a course package that later fails validation.
        videoMode: 'off',
      },
      (stage, message, progress) =>
        console.log(`[Cosmetology Course Builder] ${stage} ${progress ?? ''} ${message}`),
    );
    if (result.courseId && result.courseId !== COURSE_ID) {
      fail(`Course Factory changed canonical identity to ${result.courseId}`);
    }
    if (!result.ok) {
      fail(
        `Course Factory could not automatically repair the generated package: ${JSON.stringify(result.errors ?? result)}`,
      );
    }
    if (result.moduleCount !== EXPECTED_MODULES || result.lessonCount !== EXPECTED_LESSONS) {
      fail(`Factory returned ${result.moduleCount} modules/${result.lessonCount} lessons`);
    }
    if ((result.generationFailures ?? []).length) {
      fail(`Lesson generation failures: ${JSON.stringify(result.generationFailures)}`);
    }

    // Final exams and other generated assessments are created after the
    // pre-generation repair pass. Repair their measurable objectives before
    // the package audit so a valid assessment cannot fail on ordering alone.
    const postGenerationRepairs = await repairPersistedLessonObjectives(COURSE_ID);
    if (postGenerationRepairs > 0) {
      console.log(
        `[Cosmetology Course Builder] repaired ${postGenerationRepairs} post-generation lesson objectives`,
      );
    }
  }

  await updateJob(db, {
    status: 'running',
    stage: 'validating',
    progress: 80,
    message: 'Lesson generation completed; validating the canonical package.',
  });
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
      // The course is not complete when media is merely queued. Every lesson
      // remains one unified in-progress package until its locked narration,
      // visual plan, rendered video, and quality evidence are promoted by the
      // canonical video completion transition.
      generation_status: 'generating',
      generation_progress: 95,
      total_lessons: EXPECTED_LESSONS,
      review_status: 'draft',
    })
    .eq('id', COURSE_ID);
  if (stateError) fail(`Final safe-state update failed: ${stateError.message}`);

  await updateJob(db, {
    status: 'running',
    stage: 'media',
    progress: 95,
    message: 'Unified lesson packages are rendering; this build remains incomplete until all 40 matching videos are attached and verified.',
    completed_at: null,
    details: {
      course_id: COURSE_ID,
      modules: EXPECTED_MODULES,
      lessons: EXPECTED_LESSONS,
      lesson_videos_queued: media.queued,
      microclips_queued: media.microclipsQueued,
    },
  });
  console.log('COSMETOLOGY_COURSE_BUILD_MEDIA_PENDING');
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
        completion: 'PENDING_40_VERIFIED_LESSON_VIDEO_PACKAGES',
        publication: 'PENDING_HUMAN_REVIEW_AFTER_MEDIA_ACCEPTANCE',
      },
      null,
      2,
    ),
  );
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (isTransientDatabaseError(message)) {
    console.error(
      '[Cosmetology Course Builder] database unavailable; skipping unreachable terminal-state writes.',
    );
  } else {
    try {
      const db = await requireAdminClient();
      await Promise.all([
        updateJob(db, {
          status: 'failed',
          stage: 'failed',
          message: `Course generation stopped: ${message}`,
          error: message,
          completed_at: new Date().toISOString(),
        }),
        db
          .from('courses')
          .update({
            generation_status: 'draft',
            updated_at: new Date().toISOString(),
          })
          .eq('id', COURSE_ID),
      ]);
    } catch (ledgerError) {
      console.error('[Cosmetology Course Builder] failed to record terminal state', ledgerError);
    }
  }
  console.error('COSMETOLOGY_COURSE_BUILD_FAILED');
  console.error(error);
  process.exit(1);
});
