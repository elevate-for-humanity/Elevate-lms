import test from 'node:test';
import assert from 'node:assert/strict';
import {orderCourseJobs,checkpointNeedsRecheck} from '../lib/ultimate-course-builder/core/job-observation.mjs';
test('an older job completing a new preview takes precedence over an old failed job',()=>{
 const jobs=[{id:'failed',created_at:'2026-10-16',updated_at:'2026-10-17'},
 {id:'preview',created_at:'2026-10-13',updated_at:'2026-10-18'}];
 assert.equal(orderCourseJobs(jobs)[0].id,'preview');assert.equal(jobs[0].id,'failed');
});
test('old QA findings cannot describe a newer render',()=>{
 const steps=[{step:'lesson_film_render',state:'passed',completed_at:'2026-10-18T00:01:46Z'},
 {step:'finished_media_qa',state:'failed',completed_at:'2026-10-17T21:38:06Z'}];
 assert.equal(checkpointNeedsRecheck(steps,'finished_media_qa'),true);
 steps[1].completed_at='2026-10-18T00:02:00Z';
 assert.equal(checkpointNeedsRecheck(steps,'finished_media_qa'),false);
 assert.equal(checkpointNeedsRecheck(steps,'standards_lock'),false);
});
