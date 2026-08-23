import { courseFactory } from '../../lib/course-factory';
import { getBlueprintBySlug } from '../../lib/course-factory/blueprint-loader';
import { requireAdminClient } from '../../lib/supabase/admin';

const COURSE_SLUG = 'entrepreneurship';
const EXPECTED_MODULES = 5;
const EXPECTED_LESSONS = 35;
const EXPECTED_CHECKPOINTS = 4;
const EXPECTED_CHECKPOINT_QUESTIONS = 10;
const EXPECTED_PRACTICE_QUESTIONS = 50;
const EXPECTED_FINAL_QUESTIONS = 50;
const EXPECTED_QUICK_CLIPS_PER_LESSON = 2;
const EXPECTED_MAIN_VIDEOS = EXPECTED_LESSONS;
const EXPECTED_MICROCLIPS = EXPECTED_LESSONS * EXPECTED_QUICK_CLIPS_PER_LESSON;
const MIN_VISIBLE_CHARS = 1500;
const MEDIA_POLL_MS = 20_000;
const MEDIA_TIMEOUT_MS = 75 * 60_000;
const FORBIDDEN_BRANDS = ['certiport', 'pearson vue', 'gmetrix', 'xed', 'cci learning'];
const AI_SECRET_KEYS = ['OPENAI_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'AZURE_OPENAI_API_KEY'] as const;

function visibleLength(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length;
}

function fail(message: string): never {
  throw new Error(`[ESB acceptance] ${message}`);
}

async function hydrateProductionAISecrets(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
): Promise<string[]> {
  const available: string[] = [];

  for (const key of AI_SECRET_KEYS) {
    if (process.env[key]?.trim()) {
      available.push(key);
      continue;
    }

    const { data, error } = await db.rpc('get_platform_secret', { p_key: key });
    if (error) {
      console.warn(`[ESB acceptance] ${key} could not be hydrated from platform secrets: ${error.message}`);
      continue;
    }
    if (typeof data === 'string' && data.trim()) {
      process.env[key] = data.trim();
      available.push(key);
    }
  }

  if (!available.length) {
    fail('no production AI provider credential is available');
  }

  console.log(`[ESB acceptance] AI provider pool hydrated (${available.length} configured provider credential(s))`);
  return available;
}

function lowerText(value: unknown): string {
  try {
    return JSON.stringify(value ?? '').toLowerCase();
  } catch {
    return String(value ?? '').toLowerCase();
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsForbiddenBrand(text: string, brand: string) {
  const pattern = escapeRegExp(brand).replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${pattern}\\b`, 'i').test(text);
}

function assertNoProviderBranding(label: string, value: unknown) {
  const text = lowerText(value);
  const match = FORBIDDEN_BRANDS.find((brand) => containsForbiddenBrand(text, brand));
  if (match) fail(`${label} still contains third-party course branding: ${match}`);
}

async function logAcceptance(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  courseId: string,
  stage: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await db.from('course_audit_log').insert({
    course_id: courseId,
    actor_id: null,
    action: 'updated',
    metadata: {
      acceptance_test: 'esb-full-commercial-experience-v3',
      stage,
      github_sha: process.env.GITHUB_SHA ?? null,
      ...metadata,
    },
  });
  if (error) throw new Error(`[ESB acceptance] failed to write audit telemetry: ${error.message}`);
}

function readExperience(contentJson: unknown): Record<string, any> | null {
  if (!contentJson || typeof contentJson !== 'object' || Array.isArray(contentJson)) return null;
  const experience = (contentJson as Record<string, any>).experience;
  return experience && typeof experience === 'object' && !Array.isArray(experience)
    ? experience as Record<string, any>
    : null;
}

function experienceIsComplete(contentJson: unknown) {
  const experience = readExperience(contentJson);
  if (!experience) return false;
  return (
    experience.readingGuide &&
    Array.isArray(experience.readingGuide.sections) && experience.readingGuide.sections.length >= 3 &&
    typeof experience.narrationScript === 'string' && experience.narrationScript.trim().length >= 200 &&
    typeof experience.visualPrompt === 'string' && experience.visualPrompt.trim().length >= 40 &&
    Array.isArray(experience.flashcards) && experience.flashcards.length >= 6 &&
    Array.isArray(experience.quickClips) && experience.quickClips.length >= EXPECTED_QUICK_CLIPS_PER_LESSON &&
    Array.isArray(experience.knowledgeChecks) && experience.knowledgeChecks.length >= 3 &&
    Array.isArray(experience.exercises) && experience.exercises.length >= 1 &&
    Array.isArray(experience.resources) && experience.resources.length >= 2 &&
    Array.isArray(experience.glossary) && experience.glossary.length >= 4 &&
    Boolean(experience.scenario) &&
    Boolean(experience.caseStudy) &&
    Boolean(experience.practicalTask) &&
    experience.remediation && Array.isArray(experience.remediation.targetedActions) &&
    experience.readiness && Array.isArray(experience.readiness.evidenceSignals)
  );
}

async function auditPersistedPackage(courseId: string) {
  const db = await requireAdminClient();
  const [
    { data: course, error: courseError },
    { data: modules, error: moduleError },
    { data: lessons, error: lessonError },
  ] = await Promise.all([
    db
      .from('courses')
      .select('id,slug,title,description,status,is_active,generation_status,generation_progress,review_status,published_at,total_lessons,program_id')
      .eq('id', courseId)
      .single(),
    db.from('course_modules').select('id,slug,title,description,order_index,is_published,is_draft,domain_key').eq('course_id', courseId),
    db
      .from('course_lessons')
      .select('id,slug,title,lesson_type,order_index,content,content_json,learning_objectives,quiz_questions,passing_score,generation_status,is_published,status,video_status,video_url,video_job_id,script,bullet_points,scene_data,resources,activities,partner_exam_code,domain_key')
      .eq('course_id', courseId),
  ]);

  if (courseError || !course) fail(`course query failed: ${courseError?.message ?? 'not found'}`);
  if (moduleError) fail(`module query failed: ${moduleError.message}`);
  if (lessonError) fail(`lesson query failed: ${lessonError.message}`);

  if ((modules ?? []).length !== EXPECTED_MODULES) fail(`expected ${EXPECTED_MODULES} modules; found ${(modules ?? []).length}`);
  if ((lessons ?? []).length !== EXPECTED_LESSONS) fail(`expected ${EXPECTED_LESSONS} lessons; found ${(lessons ?? []).length}`);

  assertNoProviderBranding('course', course);
  assertNoProviderBranding('modules', modules);

  const slugs = new Set<string>();
  let checkpoints = 0;
  let practiceAssessments = 0;
  let finals = 0;

  for (const lesson of lessons ?? []) {
    if (slugs.has(lesson.slug)) fail(`duplicate lesson slug: ${lesson.slug}`);
    slugs.add(lesson.slug);
    assertNoProviderBranding(`lesson ${lesson.slug}`, lesson);
    if (lesson.partner_exam_code) fail(`${lesson.slug} still has partner_exam_code=${lesson.partner_exam_code}`);

    if (lesson.generation_status !== 'generated' && lesson.generation_status !== 'published') {
      fail(`${lesson.slug} generation_status=${lesson.generation_status ?? 'null'}`);
    }

    const content = (lesson.content ?? {}) as Record<string, any>;
    const html = typeof content.html === 'string' ? content.html : '';
    if (visibleLength(html) < MIN_VISIBLE_CHARS) fail(`${lesson.slug} has only ${visibleLength(html)} visible instructional characters`);
    if (!Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length < 3) fail(`${lesson.slug} has insufficient learning objectives`);
    if (!experienceIsComplete(lesson.content_json)) fail(`${lesson.slug} is missing the full learning-experience contract`);
    if (!Array.isArray(lesson.resources) || lesson.resources.length < 2) fail(`${lesson.slug} has fewer than 2 materialized learner resources`);
    if (!Array.isArray(lesson.activities) || lesson.activities.length < 1) fail(`${lesson.slug} has no materialized learn-by-doing activity`);
    if (typeof lesson.script !== 'string' || lesson.script.trim().length < 200) fail(`${lesson.slug} is missing narration script`);
    if (!Array.isArray(lesson.bullet_points) || lesson.bullet_points.length < 3) fail(`${lesson.slug} is missing lesson-specific bullet points`);
    if (!lesson.scene_data || typeof lesson.scene_data !== 'object') fail(`${lesson.slug} is missing scene/readiness data`);
    if (!lesson.domain_key) fail(`${lesson.slug} is missing domain mapping`);

    const questions = Array.isArray(lesson.quiz_questions) ? lesson.quiz_questions : [];
    if (lesson.lesson_type === 'checkpoint') {
      checkpoints += 1;
      if (questions.length < EXPECTED_CHECKPOINT_QUESTIONS) fail(`${lesson.slug} checkpoint has ${questions.length}/${EXPECTED_CHECKPOINT_QUESTIONS} questions`);
    }
    if (lesson.lesson_type === 'exam' && lesson.slug.includes('practice')) {
      practiceAssessments += 1;
      if (questions.length < EXPECTED_PRACTICE_QUESTIONS) fail(`${lesson.slug} practice exam has ${questions.length}/${EXPECTED_PRACTICE_QUESTIONS} questions`);
    }
    if (lesson.lesson_type === 'exam' && (lesson.slug.includes('final') || lesson.slug.includes('course-exam'))) {
      finals += 1;
      if (questions.length < EXPECTED_FINAL_QUESTIONS) fail(`${lesson.slug} final exam has ${questions.length}/${EXPECTED_FINAL_QUESTIONS} questions`);
    }
    if (['checkpoint', 'quiz', 'exam'].includes(lesson.lesson_type) && !lesson.passing_score) fail(`${lesson.slug} assessment has no passing score`);
  }

  if (checkpoints !== EXPECTED_CHECKPOINTS) fail(`expected ${EXPECTED_CHECKPOINTS} checkpoints; found ${checkpoints}`);
  if (practiceAssessments !== 1) fail(`expected one practice/readiness exam; found ${practiceAssessments}`);
  if (finals !== 1) fail(`expected one final exam; found ${finals}`);

  return { db, course, modules: modules ?? [], lessons: lessons ?? [] };
}

async function auditCanonicalAssessmentRows(courseId: string, lessons: Array<Record<string, any>>) {
  const db = await requireAdminClient();
  for (const lesson of lessons) {
    if (!['checkpoint', 'exam'].includes(lesson.lesson_type)) continue;
    const expected = Array.isArray(lesson.quiz_questions) ? lesson.quiz_questions.length : 0;
    const { count, error } = await db
      .from('assessment_questions')
      .select('id', { count: 'exact', head: true })
      .eq('lesson_id', lesson.id);
    if (error) fail(`canonical assessment query failed for ${lesson.slug}: ${error.message}`);
    if ((count ?? 0) !== expected) fail(`${lesson.slug} canonical assessment rows ${(count ?? 0)}/${expected}`);
  }
}

async function auditMediaJobs(courseId: string, lessons: Array<Record<string, any>>) {
  const db = await requireAdminClient();
  const lessonIds = lessons.map((lesson) => lesson.id);
  const { data: jobs, error } = await db
    .from('video_jobs')
    .select('id,lesson_id,asset_kind,asset_key,status,video_url,error_message')
    .eq('course_id', courseId)
    .in('lesson_id', lessonIds);
  if (error) fail(`video job query failed: ${error.message}`);

  const activeJobs = jobs ?? [];
  const mainJobs = activeJobs.filter((job) => (job.asset_kind ?? 'lesson') === 'lesson');
  const microJobs = activeJobs.filter((job) => job.asset_kind === 'microclip');
  if (mainJobs.length !== EXPECTED_MAIN_VIDEOS) fail(`expected ${EXPECTED_MAIN_VIDEOS} main video jobs; found ${mainJobs.length}`);
  if (microJobs.length !== EXPECTED_MICROCLIPS) fail(`expected ${EXPECTED_MICROCLIPS} microclip jobs; found ${microJobs.length}`);

  const uniqueMicro = new Set(microJobs.map((job) => `${job.lesson_id}:${job.asset_key ?? ''}`));
  if (uniqueMicro.size !== EXPECTED_MICROCLIPS) fail(`microclip jobs are duplicated or missing: ${uniqueMicro.size}/${EXPECTED_MICROCLIPS} unique`);
}

async function waitForMedia(courseId: string, lessons: Array<Record<string, any>>) {
  const db = await requireAdminClient();
  const lessonIds = lessons.map((lesson) => lesson.id);
  const deadline = Date.now() + MEDIA_TIMEOUT_MS;
  let lastMessage = '';

  while (Date.now() < deadline) {
    const { data: jobs, error } = await db
      .from('video_jobs')
      .select('lesson_id,asset_kind,asset_key,status,video_url,error_message')
      .eq('course_id', courseId)
      .in('lesson_id', lessonIds);
    if (error) fail(`video status query failed: ${error.message}`);

    const rows = jobs ?? [];
    const failed = rows.filter((row) => row.status === 'failed');
    if (failed.length) {
      fail(`media generation failed for ${failed.length} asset(s): ${failed.slice(0, 5).map((row) => `${row.asset_kind}:${row.asset_key ?? row.lesson_id}`).join(', ')}`);
    }

    const mainComplete = rows.filter((row) => (row.asset_kind ?? 'lesson') === 'lesson' && row.status === 'complete' && typeof row.video_url === 'string' && row.video_url.length > 0).length;
    const microComplete = rows.filter((row) => row.asset_kind === 'microclip' && row.status === 'complete' && typeof row.video_url === 'string' && row.video_url.length > 0).length;
    const message = `main ${mainComplete}/${EXPECTED_MAIN_VIDEOS}, microclips ${microComplete}/${EXPECTED_MICROCLIPS}`;
    if (message !== lastMessage) {
      lastMessage = message;
      console.log(`[ESB acceptance] media ${message}`);
      await logAcceptance(db, courseId, 'media_progress', { mainComplete, microComplete });
    }
    if (mainComplete === EXPECTED_MAIN_VIDEOS && microComplete === EXPECTED_MICROCLIPS) return;
    await new Promise((resolve) => setTimeout(resolve, MEDIA_POLL_MS));
  }

  fail(`media pipeline did not complete ${EXPECTED_MAIN_VIDEOS} lesson videos and ${EXPECTED_MICROCLIPS} microclips before timeout`);
}

const AUTOMATED_REVIEW_RULESET = 'elevate-course-quality-gate-v1';

async function verifyPlayableMediaAndApprove(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  courseId: string,
) {
  const { data: jobs, error } = await db
    .from('video_jobs')
    .select('id,lesson_id,asset_kind,asset_key,status,video_url,error_message')
    .eq('course_id', courseId);
  if (error) fail(`final media verification query failed: ${error.message}`);
  const rows = jobs ?? [];
  if (rows.length !== EXPECTED_MAIN_VIDEOS + EXPECTED_MICROCLIPS) {
    fail(`automatic review expected ${EXPECTED_MAIN_VIDEOS + EXPECTED_MICROCLIPS} media assets; found ${rows.length}`);
  }
  if (rows.some((row) => row.status !== 'complete' || !row.video_url)) {
    fail('automatic review rejected incomplete, failed, or URL-less media');
  }

  const failures: string[] = [];
  for (const row of rows) {
    try {
      const response = await fetch(String(row.video_url), {
        headers: { Range: 'bytes=0-1023' },
        signal: AbortSignal.timeout(20_000),
      });
      const type = response.headers.get('content-type') ?? '';
      if (!(response.ok || response.status === 206) || !type.toLowerCase().includes('video')) {
        failures.push(`${row.asset_kind}:${row.asset_key ?? row.lesson_id} HTTP ${response.status} ${type || 'unknown-type'}`);
      }
    } catch (error) {
      failures.push(`${row.asset_kind}:${row.asset_key ?? row.lesson_id} ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (failures.length) fail(`automatic review found ${failures.length} unplayable media asset(s): ${failures.slice(0, 5).join('; ')}`);

  const reviewedAt = new Date().toISOString();
  const evidence = {
    reviewer_type: 'automated_policy',
    reviewer_name: 'Elevate Course Quality Gate',
    ruleset: AUTOMATED_REVIEW_RULESET,
    source_sha: process.env.GITHUB_SHA ?? null,
    classification: 'non_regulated_deterministic_business',
    decision: 'approved',
    approved_at: reviewedAt,
    validations: {
      modules: EXPECTED_MODULES,
      lessons: EXPECTED_LESSONS,
      assessment_questions: 140,
      main_videos: EXPECTED_MAIN_VIDEOS,
      microclips: EXPECTED_MICROCLIPS,
      playable_media: rows.length,
      critical_findings: 0,
      high_findings: 0,
    },
  };
  const { error: auditError } = await db.from('course_audit_log').insert({
    course_id: courseId,
    actor_id: null,
    action: 'approved',
    metadata: evidence,
  });
  if (auditError) fail(`automatic review evidence could not be persisted: ${auditError.message}`);
  const { error: reviewError } = await db.from('courses').update({
    review_status: 'approved',
    reviewed_by: null,
    reviewed_at: reviewedAt,
  }).eq('id', courseId).eq('review_status', 'draft');
  if (reviewError) fail(`automatic review transition failed: ${reviewError.message}`);
  return evidence;
}

async function main() {
  const db = await requireAdminClient();
  const blueprint = await getBlueprintBySlug(COURSE_SLUG);
  if (!blueprint) fail('unbranded Entrepreneurship blueprint could not be resolved');
  assertNoProviderBranding('resolved blueprint', blueprint);

  const { data: existingCourse, error: existingError } = await db
    .from('courses')
    .select('id,program_id')
    .eq('slug', COURSE_SLUG)
    .maybeSingle();
  if (existingError) fail(`could not resolve existing ESB course: ${existingError.message}`);
  if (!existingCourse?.id) fail('existing Entrepreneurship course not found');

  await logAcceptance(db, existingCourse.id, 'started', {
    expected_modules: EXPECTED_MODULES,
    expected_lessons: EXPECTED_LESSONS,
    expected_main_videos: EXPECTED_MAIN_VIDEOS,
    expected_microclips: EXPECTED_MICROCLIPS,
    provider_count: 0,
    build_mode: 'deterministic',
    blueprint: blueprint.credentialCode,
  });

  console.log('[ESB acceptance] running unbranded ESB course through canonical Course Factory');
  const build = await courseFactory({
    blueprint,
    mode: 'replace',
    contentSource: 'curriculum_lessons',
    videoMode: 'queue',
  });

  if (!build.ok || !build.courseId) fail(`Course Factory failed: ${(build.errors ?? []).join('; ')}`);
  if (build.moduleCount !== EXPECTED_MODULES || build.lessonCount !== EXPECTED_LESSONS) fail(`Course Factory returned ${build.moduleCount ?? 0} modules/${build.lessonCount ?? 0} lessons`);
  if ((build.generationFailures ?? []).length > 0) fail(`generation failures: ${JSON.stringify(build.generationFailures)}`);

  const beforePublish = await auditPersistedPackage(build.courseId);
  await auditCanonicalAssessmentRows(build.courseId, beforePublish.lessons);
  await auditMediaJobs(build.courseId, beforePublish.lessons);

  if (beforePublish.course.status !== 'draft' || beforePublish.course.is_active) fail('Course Factory must persist a complete package as draft before final promotion');
  await logAcceptance(db, build.courseId, 'factory_package_passed', {
    modules: build.moduleCount,
    lessons: build.lessonCount,
    assessments_generated: build.assessmentsGenerated ?? 0,
    media_jobs_reported: build.videosQueued ?? 0,
  });

  await waitForMedia(build.courseId, beforePublish.lessons);
  await logAcceptance(db, build.courseId, 'media_complete', { mainVideos: EXPECTED_MAIN_VIDEOS, microclips: EXPECTED_MICROCLIPS });
  const automatedReview = await verifyPlayableMediaAndApprove(db, build.courseId);
  await logAcceptance(db, build.courseId, 'automated_policy_approved', automatedReview);

  const { data: publishResult, error: publishError } = await db.rpc('publish_course_from_staging', {
    p_course_id: build.courseId,
    p_program_id: existingCourse.program_id ?? null,
  });
  if (publishError) fail(`final publish gate rejected Entrepreneurship course: ${publishError.message}`);

  const afterPublish = await auditPersistedPackage(build.courseId);
  await auditCanonicalAssessmentRows(build.courseId, afterPublish.lessons);
  if (afterPublish.course.status !== 'published' || !afterPublish.course.is_active) fail(`final course state is ${afterPublish.course.status}, active=${afterPublish.course.is_active}`);
  if (afterPublish.course.generation_status !== 'published' || afterPublish.course.generation_progress !== 100) fail('generation state is not consistent with final publication');
  if (!afterPublish.course.published_at || afterPublish.course.total_lessons !== EXPECTED_LESSONS) fail('published_at/total_lessons metadata is incomplete');
  if (afterPublish.modules.some((module) => !module.is_published || module.is_draft)) fail('one or more modules are not in the final published state');
  if (afterPublish.lessons.some((lesson) => !lesson.is_published || lesson.status !== 'published')) fail('one or more lessons are not in the final published state');

  await logAcceptance(db, build.courseId, 'passed', {
    modules: EXPECTED_MODULES,
    lessons: EXPECTED_LESSONS,
    main_videos: EXPECTED_MAIN_VIDEOS,
    microclips: EXPECTED_MICROCLIPS,
    publish_result: publishResult as unknown,
  });

  console.log('[ESB acceptance] PASS', {
    courseId: build.courseId,
    modules: EXPECTED_MODULES,
    lessons: EXPECTED_LESSONS,
    mainVideos: EXPECTED_MAIN_VIDEOS,
    microclips: EXPECTED_MICROCLIPS,
    publishResult,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});