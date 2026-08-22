import { courseFactory } from '../../lib/course-factory';
import { queueCourseLessonVideos } from '../../lib/course-factory/media-service';
import { getBlueprintBySlug } from '../../lib/course-factory/blueprint-loader';
import { requireAdminClient } from '../../lib/supabase/admin';

const PROGRAM_SLUG = 'business-administration';
const EXPECTED_MODULES = 5;
const EXPECTED_LESSONS = 35;

function fail(message: string): never {
  throw new Error(`[Business Draft Bootstrap] ${message}`);
}

function instructionalText(value: unknown): string {
  if (typeof value === 'string') return value.replace(/<[^>]*>/g, ' ');
  if (Array.isArray(value)) return value.map(instructionalText).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(instructionalText).join(' ');
  }
  return '';
}

async function main() {
  const db = await requireAdminClient();
  const blueprint = await getBlueprintBySlug(PROGRAM_SLUG);
  if (!blueprint) fail('Canonical Business blueprint not found');

  const { data: program, error: programError } = await db
    .from('programs')
    .select('id,slug,title')
    .eq('slug', PROGRAM_SLUG)
    .maybeSingle();
  if (programError || !program?.id) {
    fail(`Canonical Business program not found: ${programError?.message ?? PROGRAM_SLUG}`);
  }

  const { data: existingCourse, error: courseError } = await db
    .from('courses')
    .select('id,program_id')
    .eq('slug', PROGRAM_SLUG)
    .maybeSingle();
  if (courseError) fail(`Course lookup failed: ${courseError.message}`);

  let courseId = existingCourse?.id ?? null;
  let reusable = false;
  if (courseId && existingCourse?.program_id === program.id) {
    const [{ count: modules }, { count: lessons }] = await Promise.all([
      db.from('course_modules').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
      db.from('course_lessons').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
    ]);
    reusable = modules === EXPECTED_MODULES && lessons === EXPECTED_LESSONS;
  }

  if (!reusable) {
    const build = await courseFactory({
      programId: program.id,
      programSlug: PROGRAM_SLUG,
      blueprint,
      mode: 'replace',
      contentSource: 'ai',
      videoMode: 'queue',
    });
    if (!build.ok || !build.courseId) {
      fail(`Course Factory failed: ${JSON.stringify(build.errors ?? [])}`);
    }
    if (build.moduleCount !== EXPECTED_MODULES || build.lessonCount !== EXPECTED_LESSONS) {
      fail(`Factory returned ${build.moduleCount} modules/${build.lessonCount} lessons`);
    }
    if ((build.generationFailures ?? []).length > 0) {
      fail(`Generation failures: ${JSON.stringify(build.generationFailures)}`);
    }
    courseId = build.courseId;
  }

  if (!courseId) fail('Canonical course identity missing after build');

  const [{ data: modules, error: moduleError }, { data: lessons, error: lessonError }] = await Promise.all([
    db.from('course_modules').select('id,title,domain_key,target_hours').eq('course_id', courseId),
    db.from('course_lessons')
      .select('id,slug,content,content_json,learning_objectives,script,generation_status')
      .eq('course_id', courseId),
  ]);
  if (moduleError) fail(moduleError.message);
  if (lessonError) fail(lessonError.message);
  if ((modules ?? []).length !== EXPECTED_MODULES) fail(`Expected 5 modules; found ${(modules ?? []).length}`);
  if ((lessons ?? []).length !== EXPECTED_LESSONS) fail(`Expected 35 lessons; found ${(lessons ?? []).length}`);

  for (const module of modules ?? []) {
    if (!module.domain_key?.trim()) fail(`${module.title} missing standards mapping`);
    if (!module.target_hours || Number(module.target_hours) <= 0) fail(`${module.title} missing target hours`);
  }

  for (const lesson of lessons ?? []) {
    const payloadLength = instructionalText(lesson.content).replace(/\s+/g, ' ').trim().length;
    if (payloadLength < 1000) fail(`${lesson.slug} insufficient instructional content (${payloadLength})`);
    if (!Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length < 3) fail(`${lesson.slug} missing objectives`);
    if (typeof lesson.script !== 'string' || lesson.script.trim().length < 200) fail(`${lesson.slug} missing narration`);
    if (!lesson.content_json || typeof lesson.content_json !== 'object') fail(`${lesson.slug} missing interactive experience`);
  }

  const media = await queueCourseLessonVideos({ courseId, onlyMissing: true, force: false, limit: null });
  if (media.failed > 0) fail(`${media.failed} media enqueue operations failed`);

  await db.from('courses').update({ status: 'draft', is_active: false, published_at: null }).eq('id', courseId);

  console.log('[Business Draft Bootstrap] READY');
  console.log(JSON.stringify({
    programId: program.id,
    courseId,
    modules: (modules ?? []).length,
    lessons: (lessons ?? []).length,
    mainVideosQueued: media.queued,
    microclipsQueued: media.microclipsQueued,
    publication: 'BLOCKED_PENDING_FULL_ACCEPTANCE_AND_HUMAN_REVIEW',
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
