import { courseFactory } from '../../lib/course-factory';
import { getBlueprintBySlug } from '../../lib/course-factory/blueprint-loader';
import { requireAdminClient } from '../../lib/supabase/admin';
import { publishPersistedCourseWithClient, runPersistedCourseProcurementHealthCheckWithClient } from '../../lib/course-builder/persisted-publish-service';

const PROGRAM_SLUG = 'business-administration';
const EXPECTED_MODULES = 5, EXPECTED_LESSONS = 35, EXPECTED_MAIN_VIDEOS = 35, EXPECTED_MICROCLIPS = 70;
const MEDIA_POLL_MS = 15_000, MEDIA_TIMEOUT_MS = 75 * 60_000;
const ADMIN_URL = (process.env.ADMIN_URL || 'https://admin.elevateforhumanity.org').replace(/\/$/, '');
const AI_SECRET_KEYS = ['GEMINI_API_KEY','GOOGLE_CLOUD_API_KEY','GROQ_API_KEY','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_AI_API_TOKEN','CLOUDFLARE_API_TOKEN','OPENAI_API_KEY','ANTHROPIC_API_KEY','AZURE_OPENAI_API_KEY'] as const;
function fail(message: string): never { throw new Error(`[Business Course Builder] ${message}`); }
async function hydrateAISecrets(db: Awaited<ReturnType<typeof requireAdminClient>>) {
  const available: string[] = [];
  for (const key of AI_SECRET_KEYS) { if (process.env[key]?.trim()) { available.push(key); continue; } const { data, error } = await db.rpc('get_platform_secret', { p_key: key }); if (!error && typeof data === 'string' && data.trim()) { process.env[key] = data.trim(); available.push(key); } }
  const usable = available.some((key) => ['GEMINI_API_KEY','GOOGLE_CLOUD_API_KEY','GROQ_API_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY','AZURE_OPENAI_API_KEY'].includes(key)) || (available.includes('CLOUDFLARE_ACCOUNT_ID') && (available.includes('CLOUDFLARE_AI_API_TOKEN') || available.includes('CLOUDFLARE_API_TOKEN')));
  if (!usable) fail('No AI provider credential is available');
}
async function kickMediaWorker() { const secret = process.env.CRON_SECRET?.trim(); if (!secret) return; try { await fetch(`${ADMIN_URL}/api/internal/videos/process-queue`, { method:'POST', headers:{ authorization:`Bearer ${secret}`, 'content-type':'application/json' }, signal:AbortSignal.timeout(45_000) }); } catch {} }
async function waitForMedia(courseId: string) {
  const db = await requireAdminClient(), deadline = Date.now() + MEDIA_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await kickMediaWorker(); const { data, error } = await db.from('video_jobs').select('asset_kind,status,video_url,error_message').eq('course_id', courseId); if (error) fail(`Video job query failed: ${error.message}`);
    const rows = data ?? [], failed = rows.filter((r) => r.status === 'failed'); if (failed.length) fail(`Media generation failed: ${failed.slice(0,3).map((r) => r.error_message ?? 'unknown').join(' | ')}`);
    const main = rows.filter((r) => (r.asset_kind ?? 'lesson') === 'lesson' && r.status === 'complete' && r.video_url).length, micro = rows.filter((r) => r.asset_kind === 'microclip' && r.status === 'complete' && r.video_url).length;
    console.log(`[Business Course Builder] media main ${main}/${EXPECTED_MAIN_VIDEOS}, micro ${micro}/${EXPECTED_MICROCLIPS}`); if (main === EXPECTED_MAIN_VIDEOS && micro === EXPECTED_MICROCLIPS) return; await new Promise((r) => setTimeout(r, MEDIA_POLL_MS));
  } fail('Media generation timed out before all required media completed');
}
async function auditCourse(courseId: string) {
  const db = await requireAdminClient(); const [{data:modules,error:me},{data:lessons,error:le}] = await Promise.all([db.from('course_modules').select('id,title,domain_key,target_hours').eq('course_id',courseId),db.from('course_lessons').select('id,title,slug,content,content_json,learning_objectives,quiz_questions,script,video_url,generation_status').eq('course_id',courseId)]); if(me) fail(me.message); if(le) fail(le.message);
  if ((modules??[]).length!==EXPECTED_MODULES) fail(`Expected ${EXPECTED_MODULES} modules; found ${(modules??[]).length}`); if ((lessons??[]).length!==EXPECTED_LESSONS) fail(`Expected ${EXPECTED_LESSONS} lessons; found ${(lessons??[]).length}`);
  for (const m of modules??[]) { if(!m.domain_key?.trim()) fail(`${m.title} missing standards mapping`); if(!m.target_hours||Number(m.target_hours)<=0) fail(`${m.title} invalid target hours`); }
  for (const lesson of lessons??[]) { const raw=lesson.content; const content=typeof raw==='string'?(()=>{try{return JSON.parse(raw) as Record<string,unknown>}catch{return null}})():raw as Record<string,unknown>|null; const html=typeof content?.html==='string'?content.html:''; if(html.replace(/<[^>]*>/g,' ').trim().length<1000) fail(`${lesson.slug} insufficient content`); if(!Array.isArray(lesson.learning_objectives)||lesson.learning_objectives.length<3) fail(`${lesson.slug} missing objectives`); if(typeof lesson.script!=='string'||lesson.script.trim().length<200) fail(`${lesson.slug} missing narration`); if(!lesson.content_json||typeof lesson.content_json!=='object') fail(`${lesson.slug} missing interactive experience`); if(!['generated','completed','verification_ready','certificate_ready','published'].includes(lesson.generation_status??'')) fail(`${lesson.slug} generation status ${lesson.generation_status}`); }
}
async function main() {
  const db=await requireAdminClient(); await hydrateAISecrets(db); const blueprint=await getBlueprintBySlug(PROGRAM_SLUG); if(!blueprint) fail('Business blueprint not found'); const {data:program,error:pe}=await db.from('programs').select('id,slug,title').eq('slug',PROGRAM_SLUG).maybeSingle(); if(pe||!program?.id) fail(`Canonical program not found: ${pe?.message??PROGRAM_SLUG}`);
  const build=await courseFactory({programId:program.id,programSlug:PROGRAM_SLUG,blueprint,mode:'replace',contentSource:'ai',videoMode:'queue'}); if(!build.ok||!build.courseId) fail(`Course Factory failed: ${JSON.stringify(build.errors??[])}`); if(build.moduleCount!==EXPECTED_MODULES||build.lessonCount!==EXPECTED_LESSONS) fail(`Factory returned ${build.moduleCount} modules/${build.lessonCount} lessons`); if((build.generationFailures??[]).length) fail(`Generation failures: ${JSON.stringify(build.generationFailures)}`);
  await auditCourse(build.courseId); const {data:jobs,error:je}=await db.from('video_jobs').select('id,asset_kind').eq('course_id',build.courseId); if(je) fail(je.message); const mainJobs=(jobs??[]).filter((j)=>(j.asset_kind??'lesson')==='lesson').length,microJobs=(jobs??[]).filter((j)=>j.asset_kind==='microclip').length; if(mainJobs!==EXPECTED_MAIN_VIDEOS||microJobs!==EXPECTED_MICROCLIPS) fail(`Expected ${EXPECTED_MAIN_VIDEOS}/${EXPECTED_MICROCLIPS} media jobs; found ${mainJobs}/${microJobs}`);
  await waitForMedia(build.courseId); await auditCourse(build.courseId);
  const procurement=await runPersistedCourseProcurementHealthCheckWithClient(db,build.courseId); if(!procurement.pass) fail(`Automated procurement gate blocked publication: ${JSON.stringify({blocking_issues:procurement.blocking_issues,metrics:procurement.metrics},null,2)}`);
  const publication=await publishPersistedCourseWithClient({db,courseId:build.courseId,actorId:'00000000-0000-0000-0000-000000000000',label:'Business #10005173 automated verified acceptance'}); if(!publication.ok) fail(`Canonical publication failed: ${JSON.stringify(publication)}`); if(!(publication as any).version?.id) fail('Publication did not create immutable version');
  const {data:finalCourse,error:fe}=await db.from('courses').select('id,slug,title,program_id,status,is_active,generation_status,generation_progress,total_lessons').eq('id',build.courseId).single(); if(fe||!finalCourse) fail(`Final verification failed: ${fe?.message??'missing course'}`); if(finalCourse.status!=='published'||!finalCourse.is_active||finalCourse.program_id!==program.id) fail(`Final state invalid: ${JSON.stringify(finalCourse)}`);
  console.log('[Business Course Builder] PASS'); console.log(JSON.stringify({programId:program.id,courseId:build.courseId,modules:build.moduleCount,lessons:build.lessonCount,videos:EXPECTED_MAIN_VIDEOS,microclips:EXPECTED_MICROCLIPS,procurement:procurement.metrics,versionId:(publication as any).version.id,status:finalCourse.status,active:finalCourse.is_active,reviewMode:'automated_validation'},null,2));
}
main().catch((error)=>{console.error(error);process.exit(1)});
