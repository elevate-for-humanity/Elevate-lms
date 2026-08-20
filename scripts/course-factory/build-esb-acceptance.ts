import { courseFactory } from '../../lib/course-factory';
import { entrepreneurshipBlueprint } from '../../lib/curriculum/blueprints/entrepreneurship';
import { requireAdminClient } from '../../lib/supabase/admin';

const COURSE_SLUG = 'entrepreneurship';
const EXPECTED_MODULES = 5;
const EXPECTED_LESSONS = 35;
const EXPECTED_CHECKPOINT_QUESTIONS = 10;
const EXPECTED_FINAL_QUESTIONS = 50;
const MIN_VISIBLE_CHARS = 1500;
const MEDIA_POLL_MS = 30_000;
const MEDIA_TIMEOUT_MS = 45 * 60_000;

function visibleLength(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length;
}

function fail(message: string): never {
  throw new Error(`[ESB acceptance] ${message}`);
}

function experienceIsComplete(contentJson: unknown) {
  if (!contentJson || typeof contentJson !== 'object') return false;
  const row = contentJson as Record<string, any>;
  const experience = row.experience;
  if (!experience || typeof experience !== 'object') return false;
  return (
    typeof experience.narrationScript === 'string' && experience.narrationScript.trim().length >= 200 &&
    typeof experience.visualPrompt === 'string' && experience.visualPrompt.trim().length >= 40 &&
    Array.isArray(experience.flashcards) && experience.flashcards.length >= 4 &&
    Array.isArray(experience.knowledgeChecks) && experience.knowledgeChecks.length >= 3 &&
    Boolean(experience.scenario) &&
    Boolean(experience.caseStudy) &&
    Boolean(experience.practicalTask) &&
    Boolean(experience.remediation)
  );
}

async function auditPersistedPackage(courseId: string) {
  const db = await requireAdminClient();

  const [{ data: course, error: courseError }, { data: modules, error: moduleError }, { data: lessons, error: lessonError }] =
    await Promise.all([
      db
        .from('courses')
        .select('id,slug,title,status,is_active,generation_status,generation_progress,review_status,published_at,total_lessons,program_id')
        .eq('id', courseId)
        .single(),
      db.from('course_modules').select('id,slug,title,order_index,is_published,is_draft').eq('course_id', courseId),
      db
        .from('course_lessons')
        .select(
          'id,slug,title,lesson_type,order_index,content,content_json,learning_objectives,quiz_questions,passing_score,generation_status,is_published,status,video_status,video_url,video_job_id,script,bullet_points,scene_data',
        )
        .eq('course_id', courseId),
    ]);

  if (courseError || !course) fail(`course query failed: ${courseError?.message ?? 'not found'}`);
  if (moduleError) fail(`module query failed: ${moduleError.message}`);
  if (lessonError) fail(`lesson query failed: ${lessonError.message}`);

  if ((modules ?? []).length !== EXPECTED_MODULES) {
    fail(`expected ${EXPECTED_MODULES} modules; found ${(modules ?? []).length}`);
  }
  if ((lessons ?? []).length !== EXPECTED_LESSONS) {
    fail(`expected ${EXPECTED_LESSONS} lessons; found ${(lessons ?? []).length}`);
  }

  const slugs = new Set<string>();
  for (const lesson of lessons ?? []) {
    if (slugs.has(lesson.slug)) fail(`duplicate lesson slug: ${lesson.slug}`);
    slugs.add(lesson.slug);

    if (lesson.generation_status !== 'generated') {
      fail(`${lesson.slug} generation_status=${lesson.generation_status ?? 'null'}`);
    }

    const content = (lesson.content ?? {}) as Record<string, any>;
    const html = typeof content.html === 'string' ? content.html : '';
    if (visibleLength(html) < MIN_VISIBLE_CHARS) {
      fail(`${lesson.slug} has only ${visibleLength(html)} visible instructional characters`);
    }

    if (!Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length < 1) {
      fail(`${lesson.slug} has no persisted learning objectives`);
    }

    if (!experienceIsComplete(lesson.content_json)) {
      fail(`${lesson.slug} is missing the complete interactive learner experience contract`);
    }

    if (typeof lesson.script !== 'string' || lesson.script.trim().length < 200) {
      fail(`${lesson.slug} is missing narration script`);
    }
    if (!Array.isArray(lesson.bullet_points) || lesson.bullet_points.length < 3) {
      fail(`${lesson.slug} is missing lesson-specific bullet points`);
    }
    if (!lesson.scene_data || typeof lesson.scene_data !== 'object') {
      fail(`${lesson.slug} is missing visual scene data`);
    }

    const questions = Array.isArray(lesson.quiz_questions) ? lesson.quiz_questions : [];
    if (lesson.lesson_type === 'checkpoint' && questions.length < EXPECTED_CHECKPOINT_QUESTIONS) {
      fail(`${lesson.slug} checkpoint has ${questions.length}/${EXPECTED_CHECKPOINT_QUESTIONS} questions`);
    }
    if (lesson.lesson_type === 'exam' && questions.length < EXPECTED_FINAL_QUESTIONS) {
      fail(`${lesson.slug} final exam has ${questions.length}/${EXPECTED_FINAL_QUESTIONS} questions`);
    }
    if (['checkpoint', 'quiz', 'exam'].includes(lesson.lesson_type) && !lesson.passing_score) {
      fail(`${lesson.slug} assessment has no passing score`);
    }
  }

  return { db, course, modules: modules ?? [], lessons: lessons ?? [] };
}

async function waitForMedia(courseId: string) {
  const db = await requireAdminClient();
  const deadline = Date.now() + MEDIA_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { data, error } = await db
      .from('course_lessons')
      .select('slug,video_status,video_url,video_error')
      .eq('course_id', courseId);
    if (error) fail(`video status query failed: ${error.message}`);

    const rows = data ?? [];
    const failed = rows.filter((row) => row.video_status === 'failed');
    if (failed.length) {
      fail(`video generation failed for ${failed.length} lesson(s): ${failed.slice(0, 5).map((row) => row.slug).join(', ')}`);
    }

    const complete = rows.filter(
      (row) => row.video_status === 'complete' && typeof row.video_url === 'string' && row.video_url.length > 0,
    ).length;
    console.log(`[ESB acceptance] media ${complete}/${EXPECTED_LESSONS} complete`);
    if (complete === EXPECTED_LESSONS) return;

    await new Promise((resolve) => setTimeout(resolve, MEDIA_POLL_MS));
  }

  fail(`video pipeline did not complete all ${EXPECTED_LESSONS} lessons within ${MEDIA_TIMEOUT_MS / 60_000} minutes`);
}

async function main() {
  const db = await requireAdminClient();

  const { data: existingCourse, error: existingError } = await db
    .from('courses')
    .select('id,program_id')
    .eq('slug', COURSE_SLUG)
    .maybeSingle();
  if (existingError) fail(`could not resolve existing ESB course: ${existingError.message}`);
  if (!existingCourse?.program_id) fail('ESB course is not tied to a canonical program_id');

  console.log('[ESB acceptance] running registered ESB v2 blueprint through canonical Course Factory');
  const build = await courseFactory({
    programId: existingCourse.program_id,
    blueprint: entrepreneurshipBlueprint,
    mode: 'replace',
    contentSource: 'ai',
    videoMode: 'queue',
  });

  if (!build.ok || !build.courseId) {
    fail(`Course Factory failed: ${(build.errors ?? []).join('; ')}`);
  }
  if (build.moduleCount !== EXPECTED_MODULES || build.lessonCount !== EXPECTED_LESSONS) {
    fail(`Course Factory returned ${build.moduleCount ?? 0} modules/${build.lessonCount ?? 0} lessons`);
  }
  if ((build.generationFailures ?? []).length > 0) {
    fail(`generation failures: ${JSON.stringify(build.generationFailures)}`);
  }
  if ((build.videosQueued ?? 0) !== EXPECTED_LESSONS) {
    fail(`expected ${EXPECTED_LESSONS} video jobs to queue; queued ${build.videosQueued ?? 0}`);
  }

  const beforePublish = await auditPersistedPackage(build.courseId);
  if (beforePublish.course.status !== 'draft' || beforePublish.course.is_active) {
    fail('Course Factory must persist a complete package as draft before final promotion');
  }

  await waitForMedia(build.courseId);

  const { data: publishResult, error: publishError } = await db.rpc('publish_course_from_staging', {
    p_course_id: build.courseId,
    p_program_id: existingCourse.program_id,
  });
  if (publishError) fail(`final publish gate rejected ESB: ${publishError.message}`);

  const afterPublish = await auditPersistedPackage(build.courseId);
  if (afterPublish.course.status !== 'published' || !afterPublish.course.is_active) {
    fail(`final course state is ${afterPublish.course.status}, active=${afterPublish.course.is_active}`);
  }
  if (afterPublish.course.generation_status !== 'published' || afterPublish.course.generation_progress !== 100) {
    fail('generation state is not consistent with final publication');
  }
  if (!afterPublish.course.published_at || afterPublish.course.total_lessons !== EXPECTED_LESSONS) {
    fail('published_at/total_lessons metadata is incomplete');
  }
  if (afterPublish.modules.some((module) => !module.is_published || module.is_draft)) {
    fail('one or more modules are not in the final published state');
  }
  if (afterPublish.lessons.some((lesson) => !lesson.is_published || lesson.status !== 'published')) {
    fail('one or more lessons are not in the final published state');
  }

  console.log('[ESB acceptance] PASS', {
    courseId: build.courseId,
    modules: EXPECTED_MODULES,
    lessons: EXPECTED_LESSONS,
    assessmentsGenerated: build.assessmentsGenerated,
    videosQueued: build.videosQueued,
    publishResult,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
