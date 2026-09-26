import fs from 'node:fs';import path from 'node:path';
const roots=['lib/ultimate-course-builder/core/production-handlers.ts','lib/ultimate-course-builder/core/runtime-factory.ts','lib/ultimate-course-builder/core/full-course-runner.ts'];
const forbidden=['generation_required','render_required','inspection_required',"status:'planned'","status:'observed'",'HANDLER_NOT_IMPLEMENTED'];
const failures=[];
for(const file of roots){if(!fs.existsSync(file)){failures.push('missing '+file);continue;}const src=fs.readFileSync(file,'utf8');for(const token of forbidden)if(src.includes(token))failures.push(file+' contains forbidden production placeholder '+token);}
const required=['standards_lock','learning_objectives','prerequisites','teaching_sequence','instructor_script','storyboard','visual_assignment','scene_construction','natural_narration','synchronization','active_teaching','mistakes_and_corrections','assessment_alignment','lesson_film_render','finished_media_qa','instructional_qa','narration_qa','learner_runthrough','selective_repair','credential_release'];
const handlers=fs.readFileSync('lib/ultimate-course-builder/core/production-handlers.ts','utf8');for(const step of required)if(!handlers.includes(step+':'))failures.push('production handler missing '+step);
if(failures.length){console.error(failures.join('\n'));process.exit(1);}console.log('Ultimate production acceptance guard: PASS — 20 handlers present; no status-only completion tokens.');
