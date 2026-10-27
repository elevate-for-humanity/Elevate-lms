import { courseFactory } from '../../lib/course-factory';
import { publishCourse } from '../../lib/course-factory/publisher';
import { queueCourseLessonVideos } from '../../lib/course-factory/media-service';
import { recoverCourseMediaJobs } from '../../lib/course-factory/media-manager';
import { getBlueprintBySlug } from '../../lib/course-factory/blueprint-loader';
import { requireAdminClient } from '../../lib/supabase/admin';
import {
  publishPersistedCourseWithClient,
  runPersistedCourseProcurementHealthCheckWithClient,
} from '../../lib/course-builder/persisted-publish-service';

const PROGRAM_SLUG = 'business-administration';
const EXPECTED_MODULES = 5;
const EXPECTED_LESSONS = 35;
const EXPECTED_MAIN_VIDEOS = 35;
const EXPECTED_MICROCLIPS = 70;
const MEDIA_POLL_MS = 15_000;
const MEDIA_TIMEOUT_MS = 75 * 60_000;
const ADMIN_URL = (process.env.ADMIN_URL || 'https://admin.elevateforhumanity.org').replace(
  /\/$/,
  '',
);
const AI_SECRET_KEYS = [
  'GEMINI_API_KEY',
  'GOOGLE_CLOUD_API_KEY',
  'GROQ_API_KEY',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_AI_API_TOKEN',
  'CLOUDFLARE_API_TOKEN',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'AZURE_OPENAI_API_KEY',
] as const;

type AdminDb = Awaited<ReturnType<typeof requireAdminClient>>;
type MediaJobRow = {
  lesson_id: string | null;
  asset_kind: string | null;
  asset_key: string | null;
  status: string | null;
  video_url: string | null;
  error_message: string | null;
};

function fail(message: string): never {
  throw new Error(`[Business Course Builder] ${message}`);
}

function instructionalText(value: unknown): string {
  if (typeof value === 'string') return value.replace(/<[^>]*>/g, ' ');
  if (Array.isArray(value)) return value.map(instructionalText).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(instructionalText)
      .join(' ');
  }
  return '';
}

function mediaAssetKey(row: MediaJobRow): string {
  return `${row.lesson_id}:${row.asset_kind ?? 'lesson'}:${row.asset_key ?? ''}`;
}

function summarizeMedia(rows: MediaJobRow[]) {
  const groups = new Map<string, MediaJobRow[]>();
  for (const row of rows) {
    const key = mediaAssetKey(row);
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  }

  let mainAssets = 0;
  let microclipAssets = 0;
  let mainComplete = 0;
  let microclipsComplete = 0;
  const failedOnly: MediaJobRow[][] = [];

  for (const group of groups.values()) {
    const kind = group[0]?.asset_kind ?? 'lesson';
    const complete = group.some((row) => row.status === 'complete' && Boolean(row.video_url));
    const pending = group.some((row) => row.status === 'queued' || row.status === 'rendering');
    const failed = group.some((row) => row.status === 'failed');

    if (kind === 'microclip') {
      microclipAssets += 1;
      if (complete) microclipsComplete += 1;
    } else {
      mainAssets += 1;
      if (complete) mainComplete += 1;
    }

    if (!complete && !pending && failed) failedOnly.push(group);
  }

  return { mainAssets, microclipAssets, mainComplete, microclipsComplete, failedOnly };
}

async function loadCurrentMediaRows(db: AdminDb, courseId: string): Promise<MediaJobRow[]> {
  const { data: lessons, error: lessonError } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId);
  if (lessonError) fail(`Lesson media identity query failed: ${lessonError.message}`);
  const lessonIds = (lessons ?? []).map((lesson) => lesson.id).filter(Boolean);
  if (lessonIds.length !== EXPECTED_LESSONS) {
    fail(
      `Media verification expected ${EXPECTED_LESSONS} current lesson identities; found ${lessonIds.length}`,
    );
  }

  const { data, error } = await db
    .from('video_jobs')
    .select('lesson_id,asset_kind,asset_key,status,video_url,error_message')
    .eq('course_id', courseId)
    .in('lesson_id', lessonIds);
  if (error) fail(`Video job query failed: ${error.message}`);
  return (data ?? []) as MediaJobRow[];
}

async function hydrateAISecrets(db: AdminDb) {
  const available: string[] = [];
  for (const key of AI_SECRET_KEYS) {
    if (process.env[key]?.trim()) {
      available.push(key);
      continue;
    }
    const { data, error } = await db.rpc('get_platform_secret', { p_key: key });
    if (!error && typeof data === 'string' && data.trim()) {
      process.env[key] = data.trim();
      available.push(key);
    }
  }

  const usable =
    available.some((key) =>
      [
        'GEMINI_API_KEY',
        'GOOGLE_CLOUD_API_KEY',
        'GROQ_API_KEY',
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'AZURE_OPENAI_API_KEY',
      ].includes(key),
    ) ||
    (available.includes('CLOUDFLARE_ACCOUNT_ID') &&
      (available.includes('CLOUDFLARE_AI_API_TOKEN') ||
        available.includes('CLOUDFLARE_API_TOKEN')));

  if (!usable)
    console.warn(
      '[Business Course Builder] No AI provider credential is available; deterministic baseline mode remains valid.',
    );
}

async function kickMediaWorker(courseId: string) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.warn(
      '[Business Course Builder] CRON_SECRET is unavailable; media worker kick skipped.',
    );
    return;
  }
  try {
    const response = await fetch(`${ADMIN_URL}/api/internal/videos/process-queue`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      body: JSON.stringify({ courseId, maxJobs: 4 }),
      signal: AbortSignal.timeout(1_800_000),
    });
    const responseBody = await response.text();
    if (!response.ok) {
      throw new Error(
        `Media worker kick returned HTTP ${response.status}: ${responseBody.slice(0, 500)}`,
      );
    }
    console.log(
      `[Business Course Builder] media worker ${response.status}: ${responseBody.slice(0, 500)}`,
    );
  } catch (error) {
    throw new Error(
      `[Business Course Builder] Media worker kick failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function repairMissingMedia(courseId: string) {
  const repair = await queueCourseLessonVideos({
    courseId,
    onlyMissing: true,
    force: false,
    limit: null,
  });
  if (repair.failed > 0) {
    console.warn(
      `[Business Course Builder] ${repair.failed} media enqueue attempt(s) failed; persisted job state will determine whether retry is still possible.`,
    );
  }
}

async function waitForMedia(courseId: string) {
  const db = await requireAdminClient();
  const deadline = Date.now() + MEDIA_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const recovery = await recoverCourseMediaJobs({ courseId });
    if (recovery.recovered.length || recovery.blocked.length) {
      console.log('[Business Course Builder] course-scoped media recovery', recovery);
    }
    await repairMissingMedia(courseId);
    await kickMediaWorker(courseId);
    const rows = await loadCurrentMediaRows(db, courseId);
    const state = summarizeMedia(rows);

    console.log(
      `[Business Course Builder] media main ${state.mainComplete}/${EXPECTED_MAIN_VIDEOS}, micro ${state.microclipsComplete}/${EXPECTED_MICROCLIPS}`,
    );

    if (
      state.mainAssets !== EXPECTED_MAIN_VIDEOS ||
      state.microclipAssets !== EXPECTED_MICROCLIPS
    ) {
      console.log(
        `[Business Course Builder] media assets present main ${state.mainAssets}/${EXPECTED_MAIN_VIDEOS}, micro ${state.microclipAssets}/${EXPECTED_MICROCLIPS}; repairing missing assets.`,
      );
    }

    if (
      state.mainComplete === EXPECTED_MAIN_VIDEOS &&
      state.microclipsComplete === EXPECTED_MICROCLIPS
    ) {
      return;
    }

    if (state.failedOnly.length > 0) {
      const messages = state.failedOnly
        .flatMap((group) => group.map((row) => row.error_message).filter(Boolean))
        .slice(0, 3);
      fail(
        `Media generation has unrecoverable failed assets: ${messages.join(' | ') || 'unknown renderer failure'}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, MEDIA_POLL_MS));
  }

  fail('Media generation timed out before all required media completed');
}

async function auditCourse(courseId: string) {
  const db = await requireAdminClient();
  const [{ data: modules, error: moduleError }, { data: lessons, error: lessonError }] =
    await Promise.all([
      db
        .from('course_modules')
        .select('id,title,domain_key,target_hours')
        .eq('course_id', courseId),
      db
        .from('course_lessons')
        .select(
          'id,title,slug,content,content_json,learning_objectives,quiz_questions,script,video_url,generation_status',
        )
        .eq('course_id', courseId),
    ]);

  if (moduleError) fail(moduleError.message);
  if (lessonError) fail(lessonError.message);
  if ((modules ?? []).length !== EXPECTED_MODULES) {
    fail(`Expected ${EXPECTED_MODULES} modules; found ${(modules ?? []).length}`);
  }
  if ((lessons ?? []).length !== EXPECTED_LESSONS) {
    fail(`Expected ${EXPECTED_LESSONS} lessons; found ${(lessons ?? []).length}`);
  }

  for (const module of modules ?? []) {
    if (!module.domain_key?.trim()) fail(`${module.title} missing standards mapping`);
    if (!module.target_hours || Number(module.target_hours) <= 0) {
      fail(`${module.title} invalid target hours`);
    }
  }

  for (const lesson of lessons ?? []) {
    const raw = lesson.content;
    const content =
      typeof raw === 'string'
        ? (() => {
            try {
              return JSON.parse(raw) as Record<string, unknown>;
            } catch {
              return { html: raw };
            }
          })()
        : (raw as Record<string, unknown> | null);
    const payloadLength = instructionalText(content).replace(/\s+/g, ' ').trim().length;
    if (payloadLength < 1000) {
      fail(`${lesson.slug} insufficient instructional payload (${payloadLength} characters)`);
    }
    if (!Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length < 3) {
      fail(`${lesson.slug} missing objectives`);
    }
    if (typeof lesson.script !== 'string' || lesson.script.trim().length < 200) {
      fail(`${lesson.slug} missing narration`);
    }
    if (!lesson.content_json || typeof lesson.content_json !== 'object') {
      fail(`${lesson.slug} missing interactive experience`);
    }
    if (
      !['generated', 'completed', 'verification_ready', 'certificate_ready', 'published'].includes(
        lesson.generation_status ?? '',
      )
    ) {
      fail(`${lesson.slug} generation status ${lesson.generation_status}`);
    }
  }
}

async function checkpointStructure(
  db: AdminDb,
  programId: string,
  blueprint: Awaited<ReturnType<typeof getBlueprintBySlug>>,
) {
  if (!blueprint) fail('Business blueprint not found');
  const { data: existing, error: existingError } = await db
    .from('courses')
    .select('id,program_id')
    .eq('slug', PROGRAM_SLUG)
    .maybeSingle();
  if (existingError) fail(`Existing course lookup failed: ${existingError.message}`);

  const [{ count: moduleCount }, { count: lessonCount }] = existing?.id
    ? await Promise.all([
        db
          .from('course_modules')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', existing.id),
        db
          .from('course_lessons')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', existing.id),
      ])
    : [{ count: 0 }, { count: 0 }];

  if (
    existing?.id &&
    existing.program_id === programId &&
    moduleCount === EXPECTED_MODULES &&
    lessonCount === EXPECTED_LESSONS
  ) {
    return existing.id as string;
  }

  const checkpoint = await publishCourse({
    programId,
    courseSlug: PROGRAM_SLUG,
    courseTitle: blueprint.title || blueprint.credentialTitle || 'Business Administration',
    blueprint,
    contentSource: 'blueprint',
    mode: 'replace',
  });
  if (!checkpoint.success || !checkpoint.courseId) {
    fail(`Deterministic structure checkpoint failed: ${checkpoint.errors.join(' | ')}`);
  }
  if (checkpoint.moduleCount !== EXPECTED_MODULES || checkpoint.lessonCount !== EXPECTED_LESSONS) {
    fail(
      `Deterministic checkpoint returned ${checkpoint.moduleCount} modules/${checkpoint.lessonCount} lessons`,
    );
  }

  const { error: stateError } = await db
    .from('courses')
    .update({
      status: 'draft',
      is_active: false,
      generation_status: 'content_pending',
      generation_progress: 15,
      total_lessons: EXPECTED_LESSONS,
      review_status: 'draft',
      published_at: null,
    })
    .eq('id', checkpoint.courseId);
  if (stateError) fail(`Deterministic checkpoint state update failed: ${stateError.message}`);

  console.log(
    `[Business Course Builder] deterministic checkpoint ready ${checkpoint.courseId}: ${EXPECTED_MODULES} modules/${EXPECTED_LESSONS} lessons`,
  );
  return checkpoint.courseId;
}

async function getReusableCourse(db: AdminDb, programId: string): Promise<string | null> {
  const { data: course, error } = await db
    .from('courses')
    .select('id,program_id')
    .eq('slug', PROGRAM_SLUG)
    .maybeSingle();
  if (error) fail(`Existing course lookup failed: ${error.message}`);
  if (!course?.id || course.program_id !== programId) return null;

  const [{ count: moduleCount, error: moduleError }, { data: lessons, error: lessonError }] =
    await Promise.all([
      db
        .from('course_modules')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', course.id),
      db
        .from('course_lessons')
        .select('content,learning_objectives,script,content_json,generation_status')
        .eq('course_id', course.id),
    ]);

  if (moduleError) fail(`Existing module count failed: ${moduleError.message}`);
  if (lessonError) fail(`Existing lesson inspection failed: ${lessonError.message}`);
  if (moduleCount !== EXPECTED_MODULES || (lessons ?? []).length !== EXPECTED_LESSONS) return null;

  const complete = (lessons ?? []).every((lesson) => {
    const payloadLength = instructionalText(lesson.content).replace(/\s+/g, ' ').trim().length;
    return (
      payloadLength >= 1000 &&
      Array.isArray(lesson.learning_objectives) &&
      lesson.learning_objectives.length >= 3 &&
      typeof lesson.script === 'string' &&
      lesson.script.trim().length >= 200 &&
      Boolean(lesson.content_json && typeof lesson.content_json === 'object') &&
      ['generated', 'completed', 'verification_ready', 'certificate_ready', 'published'].includes(
        lesson.generation_status ?? '',
      )
    );
  });

  return complete ? course.id : null;
}

async function main() {
  const db = await requireAdminClient();
  await hydrateAISecrets(db);

  const blueprint = await getBlueprintBySlug(PROGRAM_SLUG);
  if (!blueprint) fail('Business blueprint not found');

  const { data: program, error: programError } = await db
    .from('programs')
    .select('id,slug,title')
    .eq('slug', PROGRAM_SLUG)
    .maybeSingle();
  if (programError || !program?.id) {
    fail(`Canonical program not found: ${programError?.message ?? PROGRAM_SLUG}`);
  }

  await checkpointStructure(db, program.id, blueprint);

  let courseId = await getReusableCourse(db, program.id);
  let moduleCount = EXPECTED_MODULES;
  let lessonCount = EXPECTED_LESSONS;

  if (courseId) {
    console.log(
      `[Business Course Builder] Reusing complete canonical package ${courseId} so authorized human review evidence is not destroyed by a verification rerun.`,
    );
  } else {
    const build = await courseFactory({
      programId: program.id,
      programSlug: PROGRAM_SLUG,
      blueprint,
      mode: 'replace',
      contentSource: 'ai',
      videoMode: 'queue',
    });
    if (!build.ok || !build.courseId) {
      const { data: checkpoint } = await db
        .from('courses')
        .select('id')
        .eq('slug', PROGRAM_SLUG)
        .maybeSingle();
      if (checkpoint?.id) {
        await db
          .from('courses')
          .update({
            generation_status: 'failed_retryable',
            generation_progress: 15,
            status: 'draft',
            is_active: false,
          })
          .eq('id', checkpoint.id);
      }
      fail(
        `Course Factory failed after deterministic checkpoint: ${JSON.stringify(build.errors ?? [])}`,
      );
    }
    if (build.moduleCount !== EXPECTED_MODULES || build.lessonCount !== EXPECTED_LESSONS) {
      fail(`Factory returned ${build.moduleCount} modules/${build.lessonCount} lessons`);
    }
    if ((build.generationFailures ?? []).length) {
      fail(`Generation failures: ${JSON.stringify(build.generationFailures)}`);
    }
    courseId = build.courseId;
    moduleCount = build.moduleCount;
    lessonCount = build.lessonCount;
  }

  await auditCourse(courseId);

  // This production acceptance is an explicit operator-authorized repair.
  // Reset only failed/stale media belonging to the canonical Business course
  // after the renderer/runtime defect has been corrected. Completed assets
  // remain untouched, and canonical job identities prevent duplicates.
  const recovery = await recoverCourseMediaJobs({ courseId });
  console.log('[Business Course Builder] authorized course-scoped media recovery', recovery);
  if (recovery.blocked.length) {
    fail(
      `Authorized media recovery left blocked jobs: ${recovery.blocked.map((item) => `${item.jobId}: ${item.reason}`).join(' | ')}`,
    );
  }

  await repairMissingMedia(courseId);

  const initialMedia = summarizeMedia(await loadCurrentMediaRows(db, courseId));
  if (
    initialMedia.mainAssets !== EXPECTED_MAIN_VIDEOS ||
    initialMedia.microclipAssets !== EXPECTED_MICROCLIPS
  ) {
    fail(
      `Expected ${EXPECTED_MAIN_VIDEOS}/${EXPECTED_MICROCLIPS} distinct current media assets after repair; found ${initialMedia.mainAssets}/${initialMedia.microclipAssets}`,
    );
  }

  await waitForMedia(courseId);
  await auditCourse(courseId);

  const procurement = await runPersistedCourseProcurementHealthCheckWithClient(db, courseId);
  if (!procurement.pass) {
    fail(
      `Procurement gate blocked publication: ${JSON.stringify(
        { blocking_issues: procurement.blocking_issues, metrics: procurement.metrics },
        null,
        2,
      )}`,
    );
  }

  const reviewerId = String(
    (procurement.metrics as Record<string, unknown>).reviewed_by ?? '',
  ).trim();
  if (!reviewerId) {
    fail('Procurement passed without an authorized human reviewer identity');
  }

  const publication = await publishPersistedCourseWithClient({
    db,
    courseId,
    actorId: reviewerId,
    label: 'Business #10005173 verified acceptance after authorized human review',
  });
  if (!publication.ok) fail(`Canonical publication failed: ${JSON.stringify(publication)}`);
  if (!(publication as any).version?.id) fail('Publication did not create immutable version');

  const { data: finalCourse, error: finalError } = await db
    .from('courses')
    .select(
      'id,slug,title,program_id,status,is_active,generation_status,generation_progress,total_lessons,review_status,reviewed_by,reviewed_at',
    )
    .eq('id', courseId)
    .single();
  if (finalError || !finalCourse) {
    fail(`Final verification failed: ${finalError?.message ?? 'missing course'}`);
  }
  if (
    finalCourse.status !== 'published' ||
    !finalCourse.is_active ||
    finalCourse.program_id !== program.id
  ) {
    fail(`Final state invalid: ${JSON.stringify(finalCourse)}`);
  }

  console.log('[Business Course Builder] PASS');
  console.log(
    JSON.stringify(
      {
        programId: program.id,
        courseId,
        modules: moduleCount,
        lessons: lessonCount,
        videos: EXPECTED_MAIN_VIDEOS,
        microclips: EXPECTED_MICROCLIPS,
        procurement: procurement.metrics,
        versionId: (publication as any).version.id,
        status: finalCourse.status,
        active: finalCourse.is_active,
        reviewMode: 'authorized_human_review',
        reviewedBy: finalCourse.reviewed_by,
        reviewedAt: finalCourse.reviewed_at,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
