import { readFileSync } from 'node:fs';
export function coursePacingPostgresSql() {
 const migration=readFileSync(new URL('../../supabase/migrations/20261027202813_course_weekly_progressive_release.sql',import.meta.url),'utf8');
 const functions=migration.match(/CREATE(?: OR REPLACE)? FUNCTION (?:rpc_private|public)\.(?:course_pacing_start|pacing_requirement_met|paced_lesson_access|progressive_course_visible|get_my_course_pacing|guard_paced_credit_write)\([\s\S]*?\$\$;/g);
 if(functions?.length!==6) throw new Error('PACING_FUNCTION_TEST_BOUNDARY_CHANGED');
 const isolated=functions.map(source=>source.replaceAll('public.','pg_temp.').replaceAll('rpc_private.','pg_temp.')).join('\n');
 return readFileSync(new URL('./course-pacing-postgres.sql',import.meta.url),'utf8').replace('-- ACTUAL_PACING_FUNCTIONS',()=>isolated);
}
if(process.argv[1]===new URL(import.meta.url).pathname) process.stdout.write(coursePacingPostgresSql());
