import {defaultCourseMonitor} from '../../lib/ultimate-course-builder/worker/default-course-monitor.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inheritCourseProductionPolicy,COURSE_PRODUCTION_POLICY_VERSION} from '../../lib/ultimate-course-builder/core/production-policy.mjs';
import {assertRtiSubjectTeaching,lessonInstructionalSources,subjectTeachingRequirements} from '../../lib/ultimate-course-builder/instructional/rti-teaching-policy.mjs';
import {continuousCourseLease} from '../../lib/ultimate-course-builder/worker/continuous-course-lease.mjs';
for (const id of ['hvac','barber','bookkeeping','new-program']) {
 test(id+' inherits delivery and recovery without copying cosmetology content',()=>{
  const original={id,competencies:[{id:'topic',title:'Course-specific subject',requiresPracticalEvidence:true,authorityRequirementIds:[]}],instructionalSources:[{id:'topic',text:'Authorized occupation content'}],ownerPaused:true};
  const before=structuredClone(original),p=inheritCourseProductionPolicy(original);
  assert.deepEqual(original,before);
  assert.equal(p.productionPolicyVersion,COURSE_PRODUCTION_POLICY_VERSION);
  assert.equal(p.instructionalAuthoring.provider,'google');assert.equal(p.parallelAutopilot,'three-role-v1');assert.equal(p.activeLessonWorkers,'runnable-stage-required-v1');assert.equal(p.publishCompletedLessons,true);
  assert.equal(p.ownerPaused,true);assert.deepEqual(p.competencies,original.competencies);
  assert.deepEqual(p.instructionalSources,original.instructionalSources);
  assert.deepEqual(p.presentationContract.approvedReferenceVideo.permittedUses,['presentation-reference']);
  assert.doesNotMatch(subjectTeachingRequirements(p),/cosmetology|salon|hair, skin/);
  assert.throws(()=>assertRtiSubjectTeaching({segments:[{text:'Click the next button.'}]},p),/RTI_NAVIGATION_FILLER/);
  assert.equal(continuousCourseLease(id,{},0,p),true);
  assert.equal(continuousCourseLease(id,{ownerPreview:true},0,p),false);
  assert.equal(continuousCourseLease(id,{},90*60_000,p),false);
 });
}
test('explicit references, course-specific instructions, source scope and idempotency survive inheritance',()=>{
 const reference={assetId:'owner-approved',sha256:'a'.repeat(64)};
 const p=inheritCourseProductionPolicy({id:'hvac',presentationContract:{approvedReferenceVideo:reference,instructions:['Teach refrigerant safety.']},competencies:[{id:'a',title:'Safety',authorityRequirementIds:[]},{id:'b',title:'Safety Checkpoint',authorityRequirementIds:[]}],instructionalSources:[{id:'a',text:'Safety subject'},{id:'b',text:'Click next'}]});
 assert.deepEqual(p.presentationContract.approvedReferenceVideo,reference);
 assert.ok(p.presentationContract.instructions.includes('Teach refrigerant safety.'));
 assert.deepEqual(inheritCourseProductionPolicy(p),p);
 assert.deepEqual(lessonInstructionalSources(p,p.competencies[1]),[{id:'a',text:'Safety subject'}]);
});

test('new course recovery defaults on without undoing a saved disable or losing history',()=>{
 assert.equal(defaultCourseMonitor(null).enabled,true);
 assert.equal(defaultCourseMonitor({enabled:false,recoveries:2}).enabled,false);
 assert.equal(defaultCourseMonitor({enabled:true,recoveries:2}).recoveries,2);
});
