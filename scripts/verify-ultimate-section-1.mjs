import fs from 'node:fs';
const required=[
'lib/ultimate-course-builder/core/build-runner.ts',
'lib/ultimate-course-builder/core/runtime.ts',
'lib/ultimate-course-builder/persistence/supabase-persistence.ts',
'lib/ultimate-course-builder/credential/credential-provider.ts',
'lib/ultimate-course-builder/instructional/generation-contract.ts',
'lib/ultimate-course-builder/assessment/provider.ts',
'supabase/migrations/20260926090000_ultimate_course_builder_core.sql'];
const missing=required.filter(p=>!fs.existsSync(p));if(missing.length){console.error('Missing:',missing);process.exit(1);}
const migration=fs.readFileSync(required.at(-1),'utf8');
for(const table of ['ultimate_course_builds','ultimate_lesson_builds','ultimate_lesson_steps','ultimate_requirement_traceability'])if(!migration.includes(table)){console.error('Migration missing '+table);process.exit(1);}
const persistence=fs.readFileSync(required[2],'utf8');for(const table of ['ultimate_course_builds','ultimate_lesson_steps','ultimate_lesson_builds'])if(!persistence.includes(table)){console.error('Persistence missing '+table);process.exit(1);}
console.log('Ultimate section 1 structural verification: PASS');