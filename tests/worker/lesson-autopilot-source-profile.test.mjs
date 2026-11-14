import test from 'node:test';
import assert from 'node:assert/strict';
import {immutableAutopilotSourceProfile} from '../../lib/ultimate-course-builder/worker/lesson-autopilot-policy.mjs';

const base={
 id:'career-readiness',competencies:[{id:'a'}],
 instructionalSources:[{id:'a',text:'Approved teaching draft version 1'}],
 sourceDocuments:['source-a'],lessonPresentation:{layout:'guided'},
 publicationPolicy:{requiresQuality:true},ownerPaused:false,
 parallelAutopilot:'three-role-v1',publishCompletedLessons:true,
 existingLessonSourceRecovery:{version:'v1',restoredAt:'earlier'},
};

test('provenance receipts and worker operational markers do not invalidate a saved teaching source',()=>{
 const later={...base,existingLessonSourceRecovery:{version:'v1',restoredAt:'later',publicationApproved:false},
  ownerPaused:true,pauseResumeAudit:[{at:'later'}],parallelAutopilot:'three-role-v1',
  publishCompletedLessons:false,preservedPublishedLessonIds:['one']};
 assert.deepEqual(immutableAutopilotSourceProfile(base),immutableAutopilotSourceProfile(later));
});

test('actual instruction and publication policy changes still invalidate the snapshot',()=>{
 for(const changed of [
  {...base,instructionalSources:[{id:'a',text:'Different authored content'}]},
  {...base,competencies:[{id:'b'}]},
  {...base,sourceDocuments:['other-source']},
  {...base,publicationPolicy:{requiresQuality:false}},
 ]){
  assert.notDeepEqual(immutableAutopilotSourceProfile(base),immutableAutopilotSourceProfile(changed));
 }
});
