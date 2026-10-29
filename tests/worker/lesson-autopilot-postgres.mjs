import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

/** Execute the actual migration functions against session-private table copies.
 * No course, QA, publication or approval fixture enters a production table. */
export function lessonAutopilotPostgresTest(){
 const migration=['20261027182305_parallel_lesson_autopilots.sql','20261027183355_lesson_autopilot_runtime.sql','20261027195409_prioritize_lesson_autopilot_repairs.sql','20261028074705_refresh_autopilot_successor_retry_budget.sql','20261029192819_align_ultimate_database_contract_version.sql']
  .map(name=>readFileSync(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8')).join('\n')
  .replaceAll('public.','pg_temp.').replaceAll('pg_temp.course_status','public.course_status')
  .replace('CREATE TABLE pg_temp.ultimate_autopilot_pools','CREATE TEMP TABLE pg_temp.ultimate_autopilot_pools')
  .replace('CREATE TABLE pg_temp.ultimate_autopilot_runtime','CREATE TEMP TABLE pg_temp.ultimate_autopilot_runtime')
  .replace('ALTER TABLE pg_temp.ultimate_autopilot_pools ENABLE ROW LEVEL SECURITY;','')
  .replace('ALTER TABLE pg_temp.ultimate_autopilot_runtime ENABLE ROW LEVEL SECURITY;','');
 const tables=['courses','course_lessons','course_modules','ultimate_course_builds','ultimate_build_jobs','ultimate_job_attempt_history','ultimate_lesson_builds','ultimate_lesson_steps',
  'ultimate_artifacts','ultimate_artifact_versions','ultimate_artifact_dependencies','ultimate_release_versions','video_jobs'];
 return 'BEGIN;\nSET LOCAL lock_timeout=\'5s\';\n'+tables.map(table=>`CREATE TEMP TABLE ${table} (LIKE public.${table} INCLUDING ALL);`).join('\n')+'\n'+
 "SELECT set_config('request.jwt.claim.role','service_role',true);\nSELECT set_config('request.jwt.claims','{\"role\":\"service_role\"}',true);\n"+migration+'\n'+
 readFileSync(new URL('./lesson-autopilot-postgres.sql',import.meta.url),'utf8')+'\nROLLBACK;';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)process.stdout.write(lessonAutopilotPostgresTest());
