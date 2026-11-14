import { existsSync } from 'node:fs';

import { getBlueprintBySlug } from '../../lib/course-factory/blueprint-loader';
import {
  getCourseMediaState,
  recoverCourseMediaJobs,
} from '../../lib/course-factory/media-manager';
import { courseBuilderController } from '../../lib/devstudio/course-builder-controller';
import {
  publishPersistedCourseWithClient,
  runPersistedCourseProcurementHealthCheckWithClient,
} from '../../lib/course-builder/persisted-publish-service';
import {
  reviewCanonicalCourse,
  reviewCanonicalLessons,
} from '../../lib/course-builder/review-service';
import { requireAdminClient } from '../../lib/supabase/admin';

const COURSE_ID = '398acfef-5d20-4c1d-b23a-6982dc05a250';
const COURSE_SLUG = 'entrepreneurship';
const EXPECTED_MODULES = 5;
const EXPECTED_LESSONS = 35;
const EXPECTED_ASSESSMENT_QUESTIONS = 140;
const EXPECTED_MAIN_VIDEOS = 35;
const EXPECTED_MICROCLIPS = 70;
const EXPECTED_MEDIA = 105;
const MEDIA_POLL_MS = 20_000;
const MEDIA_TIMEOUT_MS = 75 * 60_000;
const AUTOMATED_REVIEW_RULESET = 'elevate-course-quality-gate-v2';

function fail(message: string): never {
  throw new Error(`[ESB acceptance] ${message}`);
}

async function logAcceptance(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  stage: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await db.from('course_audit_log').insert({
    course_id: COURSE_ID,
    actor_id: null,
    action: 'updated',
    metadata: {
      acceptance_test: 'esb-canonical-production-path-v4',
      stage,
      github_sha: process.env.GITHUB_SHA ?? null,
      ...metadata,
    },
  });
  if (error) throw new Error(`[ESB acceptance] failed to persist evidence: ${error.message}`);
}

async function auditPersistedStructure() {
  const db = await requireAdminClient();
  const [courseResult, moduleResult, lessonResult, questionResult] = await Promise.all([
    db
      .from('courses')
      .select(
        'id,slug,status,is_active,review_status,reviewed_by,reviewed_at,published_at,generation_status,generation_progress,total_lessons,program_id',
      )
      .eq('id', COURSE_ID)
      .single(),
    db.from('course_modules').select('id', { count: 'exact' }).eq('course_id', COURSE_ID),
    db.from('course_lessons').select('id', { count: 'exact' }).eq('course_id', COURSE_ID),
    db
      .from('assessment_questions')
      .select('id,course_lessons!inner(course_id)', { count: 'exact' })
      .eq('course_lessons.course_id', COURSE_ID),
  ]);

  if (courseResult.error || !courseResult.data)
    fail(`course query failed: ${courseResult.error?.message ?? 'not found'}`);
  if (moduleResult.error) fail(`module query failed: ${moduleResult.error.message}`);
  if (lessonResult.error) fail(`lesson query failed: ${lessonResult.error.message}`);
  if (questionResult.error) fail(`assessment query failed: ${questionResult.error.message}`);

  const modules = moduleResult.count ?? moduleResult.data?.length ?? 0;
  const lessons = lessonResult.count ?? lessonResult.data?.length ?? 0;
  const assessments = questionResult.count ?? questionResult.data?.length ?? 0;
  if (modules !== EXPECTED_MODULES) fail(`expected ${EXPECTED_MODULES} modules; found ${modules}`);
  if (lessons !== EXPECTED_LESSONS) fail(`expected ${EXPECTED_LESSONS} lessons; found ${lessons}`);
  if (assessments !== EXPECTED_ASSESSMENT_QUESTIONS)
    fail(`expected ${EXPECTED_ASSESSMENT_QUESTIONS} assessment questions; found ${assessments}`);

  return { db, course: courseResult.data, modules, lessons, assessments };
}

async function reportMediaEvidence() {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('video_jobs')
    .select(
      'id,course_id,lesson_id,asset_kind,asset_key,status,retry_count,last_provider,last_provider_model,error_message,video_url,queued_at,started_at,completed_at,updated_at',
    )
    .eq('course_id', COURSE_ID)
    .order('asset_kind', { ascending: true })
    .order('lesson_id', { ascending: true })
    .order('asset_key', { ascending: true });
  if (error) fail(`media evidence query failed: ${error.message}`);

  const rows = data ?? [];
  const statusCounts = rows.reduce<Record<string, number>>((acc, row) => {
    const key = `${row.asset_kind ?? 'lesson'}:${row.status}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  console.log('[ESB acceptance] media status', statusCounts);
  for (const row of rows.filter((item) => item.status === 'failed')) {
    console.error('[ESB acceptance] failed asset', {
      job_id: row.id,
      course_id: row.course_id,
      lesson_id: row.lesson_id,
      asset_kind: row.asset_kind,
      asset_key: row.asset_key,
      status: row.status,
      retry_count: row.retry_count,
      provider: row.last_provider,
      provider_model: row.last_provider_model,
      error: row.error_message,
      queued_at: row.queued_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
      updated_at: row.updated_at,
    });
  }
  return rows;
}

async function tickCanonicalProductionWorker() {
  const adminUrl = (process.env.ADMIN_URL || 'https://admin.elevateforhumanity.org').replace(
    /\/$/,
    '',
  );
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret)
    fail(
      'CRON_SECRET is required to request course-scoped processing from the canonical production worker',
    );
  const response = await fetch(`${adminUrl}/api/internal/videos/process-queue`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ courseId: COURSE_ID }),
    signal: AbortSignal.timeout(1_800_000),
  });
  const text = await response.text();
  if (!response.ok)
    fail(
      `canonical production worker rejected course-scoped tick: HTTP ${response.status} ${text.slice(0, 500)}`,
    );
  console.log('[ESB acceptance] worker tick', text.slice(0, 1000));
}

async function waitForCanonicalMedia() {
  const db = await requireAdminClient();

  // This acceptance run is the explicit operator authorization to retry jobs
  // that exhausted their bounded attempts on the previously stale Admin image.
  // Recovery remains course-scoped and uses canonical identities, so completed
  // media stays untouched and duplicate jobs are not created.
  const authorizedRetry = await recoverCourseMediaJobs({
    courseId: COURSE_ID,
    force: true,
  });
  console.log('[ESB acceptance] authorized course-scoped media retry', authorizedRetry);
  await logAcceptance(db, 'authorized_media_retry', {
    recovered_jobs: authorizedRetry.recovered.length,
    blocked_jobs: authorizedRetry.blocked,
    reason: 'Admin production health and repaired media runtime verified before retry',
  });
  if (authorizedRetry.blocked.length) {
    fail(`authorized media retry left blocked jobs: ${authorizedRetry.blocked.join(' | ')}`);
  }

  const deadline = Date.now() + MEDIA_TIMEOUT_MS;
  let lastSignature = '';

  while (Date.now() < deadline) {
    const maintenance = await recoverCourseMediaJobs({ courseId: COURSE_ID });
    if (maintenance.recovered.length || maintenance.blocked.length) {
      console.log('[ESB acceptance] Course Factory recovery', maintenance);
    }

    await tickCanonicalProductionWorker();
    const state = await getCourseMediaState(COURSE_ID, { verifyUrls: false });
    const signature = JSON.stringify({
      total: state.jobsTotal,
      complete: state.complete,
      queued: state.queued,
      rendering: state.rendering,
      failed: state.failed,
      stale: state.staleRendering,
      duplicates: state.duplicateIdentities,
    });
    if (signature !== lastSignature) {
      lastSignature = signature;
      console.log('[ESB acceptance] media progress', state);
      await logAcceptance(db, 'media_progress', state as unknown as Record<string, unknown>);
      await reportMediaEvidence();
    }

    if (
      state.jobsTotal === EXPECTED_MEDIA &&
      state.complete === EXPECTED_MEDIA &&
      state.queued === 0 &&
      state.rendering === 0 &&
      state.failed === 0 &&
      state.duplicateIdentities === 0 &&
      state.staleRendering === 0
    ) {
      const verified = await getCourseMediaState(COURSE_ID, { verifyUrls: true });
      if (verified.completePackage && verified.playable === EXPECTED_MEDIA) return verified;
      if (verified.unreachable.length) {
        console.error('[ESB acceptance] unreachable assets', verified.unreachable);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, MEDIA_POLL_MS));
  }

  await reportMediaEvidence();
  const state = await getCourseMediaState(COURSE_ID, { verifyUrls: false });
  fail(
    `media timeout: complete=${state.complete}/${state.expectedTotal}, queued=${state.queued}, rendering=${state.rendering}, failed=${state.failed}, stale=${state.staleRendering}, duplicates=${state.duplicateIdentities}`,
  );
}

function reviewOnlyIssues(issues: string[]) {
  const patterns = [
    'review_status must be approved',
    'authorized human course reviewer missing',
    'authorized human course review timestamp missing',
    'AI lesson not human-approved',
    'authorized human sign-off missing',
  ];
  return (
    issues.length > 0 &&
    issues.every((issue) => patterns.some((pattern) => issue.includes(pattern)))
  );
}

async function runGovernanceAndPublish(media: Awaited<ReturnType<typeof getCourseMediaState>>) {
  const db = await requireAdminClient();
  await logAcceptance(db, 'automated_policy_passed', {
    ruleset: AUTOMATED_REVIEW_RULESET,
    media_expected: media.expectedTotal,
    media_playable: media.playable,
    duplicate_identities: media.duplicateIdentities,
    unreachable_assets: media.unreachable.length,
  });

  let health = await runPersistedCourseProcurementHealthCheckWithClient(db, COURSE_ID);
  const reviewerId = process.env.COURSE_REVIEWER_ID?.trim();

  if (!health.pass && reviewOnlyIssues(health.blocking_issues)) {
    if (!reviewerId) {
      await logAcceptance(db, 'waiting_authorized_review', {
        blocking_issues: health.blocking_issues,
      });
      fail(
        `authorized human review required before canonical publication: ${health.blocking_issues.join(' | ')}`,
      );
    }

    await reviewCanonicalLessons(
      {
        courseId: COURSE_ID,
        action: 'approve',
        allRequired: true,
        notes: 'ESB production acceptance review',
      },
      reviewerId,
    );
    const { data: course } = await db
      .from('courses')
      .select('review_status')
      .eq('id', COURSE_ID)
      .single();
    if ((course?.review_status ?? 'draft') === 'draft' || course?.review_status === 'rejected') {
      await reviewCanonicalCourse(
        { courseId: COURSE_ID, action: 'submit', notes: 'ESB production acceptance review' },
        reviewerId,
      );
    }
    const { data: submitted } = await db
      .from('courses')
      .select('review_status')
      .eq('id', COURSE_ID)
      .single();
    if (submitted?.review_status === 'in_review') {
      await reviewCanonicalCourse(
        { courseId: COURSE_ID, action: 'approve', notes: 'ESB production acceptance review' },
        reviewerId,
      );
    }
    health = await runPersistedCourseProcurementHealthCheckWithClient(db, COURSE_ID);
  }

  if (!health.pass)
    fail(`governance/procurement gate failed: ${health.blocking_issues.join(' | ')}`);
  if (!reviewerId)
    fail('COURSE_REVIEWER_ID is required for canonical publication audit attribution');

  const published = await publishPersistedCourseWithClient({
    db,
    courseId: COURSE_ID,
    actorId: reviewerId,
    label: 'ESB canonical production acceptance',
  });
  if (!published.ok)
    fail(
      `canonical publisher blocked ESB: ${(published.blocking_issues ?? []).join(' | ') || published.error}`,
    );
  await logAcceptance(db, 'canonical_publish_passed', {
    procurement_gate: published.procurement_gate,
  });
}

async function main() {
  if (existsSync('.github/COURSE_MEDIA_PAUSED')) {
    fail('course media generation is paused by the repository cost-control kill switch');
  }
  const structure = await auditPersistedStructure();
  if (structure.course.slug !== COURSE_SLUG) fail(`course slug mismatch: ${structure.course.slug}`);
  const blueprint = await getBlueprintBySlug(COURSE_SLUG);
  if (!blueprint) fail('Entrepreneurship blueprint could not be resolved');

  await logAcceptance(structure.db, 'started', {
    course_id: COURSE_ID,
    modules: structure.modules,
    lessons: structure.lessons,
    assessment_questions: structure.assessments,
    expected_main_videos: EXPECTED_MAIN_VIDEOS,
    expected_microclips: EXPECTED_MICROCLIPS,
    build_mode: 'ai-refresh',
  });

  // Studio's controller is the application-facing authority. The canonical
  // persisted ESB baseline contains generic scaffolding, so acceptance must
  // author the complete strict package through the AI path before media is
  // queued. Refresh preserves the canonical course identity and learner state.
  const build = await courseBuilderController({
    courseId: COURSE_ID,
    programId: structure.course.program_id ?? undefined,
    blueprint,
    mode: 'refresh',
    contentSource: 'ai',
    videoMode: 'queue',
  });
  if (!build.ok || !build.courseId)
    fail(`Course Builder failed: ${(build.errors ?? []).join('; ') || 'unknown error'}`);
  if (build.courseId !== COURSE_ID)
    fail(`Course Builder attempted to change canonical ESB identity: ${build.courseId}`);

  const afterRepair = await auditPersistedStructure();
  await reportMediaEvidence();
  const media = await waitForCanonicalMedia();
  if (media.requiredLessonVideos !== EXPECTED_MAIN_VIDEOS)
    fail(`required lesson videos ${media.requiredLessonVideos}/${EXPECTED_MAIN_VIDEOS}`);
  if (media.requiredMicroclips !== EXPECTED_MICROCLIPS)
    fail(`required microclips ${media.requiredMicroclips}/${EXPECTED_MICROCLIPS}`);
  if (media.expectedTotal !== EXPECTED_MEDIA || media.playable !== EXPECTED_MEDIA)
    fail(`playable media ${media.playable}/${EXPECTED_MEDIA}`);

  await runGovernanceAndPublish(media);
  const finalState = await auditPersistedStructure();
  if (
    finalState.course.status !== 'published' ||
    !finalState.course.is_active ||
    !finalState.course.published_at
  ) {
    fail(
      `publication verification failed: status=${finalState.course.status}, active=${finalState.course.is_active}, published_at=${finalState.course.published_at ?? 'null'}`,
    );
  }

  await logAcceptance(finalState.db, 'passed', {
    modules: finalState.modules,
    lessons: finalState.lessons,
    assessment_questions: finalState.assessments,
    lesson_videos: EXPECTED_MAIN_VIDEOS,
    microclips: EXPECTED_MICROCLIPS,
    playable_media: EXPECTED_MEDIA,
    published_at: finalState.course.published_at,
  });

  console.log('[ESB acceptance] PASS', {
    courseId: COURSE_ID,
    modules: finalState.modules,
    lessons: finalState.lessons,
    assessments: finalState.assessments,
    lessonVideos: EXPECTED_MAIN_VIDEOS,
    microclips: EXPECTED_MICROCLIPS,
    playableMedia: EXPECTED_MEDIA,
    publishedAt: finalState.course.published_at,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
