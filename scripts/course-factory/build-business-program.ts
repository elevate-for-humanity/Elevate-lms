import { courseFactory } from '../../lib/course-factory';
import { getBlueprintBySlug } from '../../lib/course-factory/blueprint-loader';
import { requireAdminClient } from '../../lib/supabase/admin';

// Production acceptance runner for Indiana INTraining Program #10005173.
const PROGRAM_SLUG = 'business-administration';
const EXPECTED_MODULES = 5;
const EXPECTED_LESSONS = 35;
const EXPECTED_MAIN_VIDEOS = 35;
const EXPECTED_MICROCLIPS = 70;
const MEDIA_POLL_MS = 20_000;
const MEDIA_TIMEOUT_MS = 75 * 60_000;
const AI_SECRET_KEYS = [
  'GEMINI_API_KEY','GOOGLE_CLOUD_API_KEY','GROQ_API_KEY','CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_AI_API_TOKEN','CLOUDFLARE_API_TOKEN','OPENAI_API_KEY','ANTHROPIC_API_KEY','AZURE_OPENAI_API_KEY',
] as const;

function fail(message: string): never { throw new Error(`[Business Course Builder] ${message}`); }

async function hydrateAISecrets(db: Awaited<ReturnType<typeof requireAdminClient>>) {
  const available: string[] = [];
  for (const key of AI_SECRET_KEYS) {
    if (process.env[key]?.trim()) { available.push(key); continue; }
    const { data, error } = await db.rpc('get_platform_secret', { p_key: key });
    if (!error && typeof data === 'string' && data.trim()) { process.env[key] = data.trim(); available.push(key); }
  }
  const usable = available.some((key) => ['GEMINI_API_KEY','GOOGLE_CLOUD_API_KEY','GROQ_API_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY','AZURE_OPENAI_API_KEY'].includes(key)) ||
    (available.includes('CLOUDFLARE_ACCOUNT_ID') && (available.includes('CLOUDFLARE_AI_API_TOKEN') || available.includes('CLOUDFLARE_API_TOKEN')));
  if (!usable) fail('No AI provider credential is available');
  console.log(`[Business Course Builder] provider credentials ready: ${available.join(', ')}`);
}

async function waitForMedia(courseId: string) {
  const db = await requireAdminClient();
  const deadline = Date.now() + MEDIA_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const { data, error } = await db.from('video_jobs').select('asset_kind,status,video_url,error_message').eq('course_id', courseId);
    if (error) fail(`Video job query failed: ${error.message}`);
    const rows = data ?? [];
    const failed = rows.filter((row) => row.status === 'failed');
    if (failed.length) fail(`Media generation failed for ${failed.length} asset(s): ${failed.slice(0, 3).map((row) => row.error_message ?? 'unknown').join(' | ')}`);
    const main = rows.filter((row) => (row.asset_kind ?? 'lesson') === 'lesson' && row.status === 'complete' && row.video_url).length;
    const micro = rows.filter((row) => row.asset_kind === 'microclip' && row.status === 'complete' && row.video_url).length;
    console.log(`[Business Course Builder] media main ${main}/${EXPECTED_MAIN_VIDEOS}, micro ${micro}/${EXPECTED_MICROCLIPS}`);
    if (main === EXPECTED_MAIN_VIDEOS && micro === EXPECTED_MICROCLIPS) return;
    await new Promise((resolve) => setTimeout(resolve, MEDIA_POLL_MS));
  }
  fail('Media generation timed out before all lesson videos and microclips completed');
}

async function auditCourse(courseId: string) {
  const db = await requireAdminClient();
  const [{ data: modules, error: moduleError }, { data: lessons, error: lessonError }] = await Promise.all([
    db.from('course_modules').select('id,title,domain_key').eq('course_id', courseId),
    db.from('course_lessons').select('id,title,slug,content,content_json,learning_objectives,quiz_questions,script,video_url,generation_status').eq('course_id', courseId),
  ]);
  if (moduleError) fail(`Module audit failed: ${moduleError.message}`);
  if (lessonError) fail(`Lesson audit failed: ${lessonError.message}`);
  if ((modules ?? []).length !== EXPECTED_MODULES) fail(`Expected ${EXPECTED_MODULES} modules; found ${(modules ?? []).length}`);
  if ((lessons ?? []).length !== EXPECTED_LESSONS) fail(`Expected ${EXPECTED_LESSONS} lessons; found ${(lessons ?? []).length}`);
  for (const lesson of lessons ?? []) {
    const rawContent = lesson.content;
    const content = typeof rawContent === 'string'
      ? (() => { try { return JSON.parse(rawContent) as Record<string, unknown>; } catch { return null; } })()
      : rawContent as Record<string, unknown> | null;
    const html = typeof content?.html === 'string' ? content.html : '';
    if (html.replace(/<[^>]*>/g, ' ').trim().length < 1000) fail(`${lesson.slug} has insufficient instructional content`);
    if (!Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length < 3) fail(`${lesson.slug} is missing learning objectives`);
    if (typeof lesson.script !== 'string' || lesson.script.trim().length < 200) fail(`${lesson.slug} is missing narration script`);
    if (!lesson.content_json || typeof lesson.content_json !== 'object') fail(`${lesson.slug} is missing interactive lesson experience`);
    if (!['generated', 'published'].includes(lesson.generation_status ?? '')) fail(`${lesson.slug} generation status is ${lesson.generation_status}`);
  }
}

async function main() {
  const db = await requireAdminClient();
  await hydrateAISecrets(db);
  const blueprint = await getBlueprintBySlug(PROGRAM_SLUG);
  if (!blueprint) fail('Business & Entrepreneurship blueprint was not found');
  const { data: program, error: programError } = await db.from('programs').select('id,slug,title').eq('slug', PROGRAM_SLUG).maybeSingle();
  if (programError || !program?.id) fail(`Canonical program not found: ${programError?.message ?? PROGRAM_SLUG}`);
  const build = await courseFactory({ programId: program.id, programSlug: PROGRAM_SLUG, blueprint, mode: 'replace', contentSource: 'ai', videoMode: 'queue' });
  if (!build.ok || !build.courseId) fail(`Course Factory failed: ${JSON.stringify(build.errors ?? [], null, 2)}`);
  if (build.moduleCount !== EXPECTED_MODULES || build.lessonCount !== EXPECTED_LESSONS) fail(`Course Factory returned ${build.moduleCount ?? 0} modules and ${build.lessonCount ?? 0} lessons`);
  if ((build.generationFailures ?? []).length) fail(`Generation failures: ${JSON.stringify(build.generationFailures, null, 2)}`);
  await auditCourse(build.courseId);
  const { data: jobs, error: jobsError } = await db.from('video_jobs').select('id,asset_kind').eq('course_id', build.courseId);
  if (jobsError) fail(`Video queue audit failed: ${jobsError.message}`);
  const mainJobs = (jobs ?? []).filter((job) => (job.asset_kind ?? 'lesson') === 'lesson').length;
  const microJobs = (jobs ?? []).filter((job) => job.asset_kind === 'microclip').length;
  if (mainJobs !== EXPECTED_MAIN_VIDEOS || microJobs !== EXPECTED_MICROCLIPS) fail(`Expected ${EXPECTED_MAIN_VIDEOS} lesson video jobs and ${EXPECTED_MICROCLIPS} microclips; found ${mainJobs} and ${microJobs}`);
  await waitForMedia(build.courseId);
  await auditCourse(build.courseId);
  const { error: publishError } = await db.rpc('publish_course_from_staging', { p_course_id: build.courseId, p_program_id: program.id });
  if (publishError) fail(`Publish gate rejected course: ${publishError.message}`);
  const { data: finalCourse, error: finalError } = await db.from('courses').select('id,slug,title,program_id,status,is_active,generation_status,generation_progress,total_lessons').eq('id', build.courseId).single();
  if (finalError || !finalCourse) fail(`Final course verification failed: ${finalError?.message ?? 'missing course'}`);
  if (finalCourse.status !== 'published' || !finalCourse.is_active || finalCourse.program_id !== program.id) fail(`Final course state invalid: ${JSON.stringify(finalCourse)}`);
  console.log('[Business Course Builder] PASS');
  console.log(JSON.stringify({ programId: program.id, courseId: build.courseId, slug: finalCourse.slug, modules: build.moduleCount, lessons: build.lessonCount, videos: EXPECTED_MAIN_VIDEOS, microclips: EXPECTED_MICROCLIPS, status: finalCourse.status, active: finalCourse.is_active }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
