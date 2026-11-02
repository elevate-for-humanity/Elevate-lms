import assert from 'node:assert/strict';
import {test} from 'node:test';
import {reconcileCanonicalReleases} from '../../scripts/gcp/canonical-release-reconciliation.mjs';
const lesson={id:'lesson-1',course_id:'course-1',status:'published',is_published:true,video_status:'complete',video_url:'video-v2.mp4'};
const release={id:'release-1',course_id:'course-1',status:'released',package:{lessons:[{canonicalLessonId:'lesson-1',videoUrl:'video-v1.mp4'}]}};
test('blocks mismatched effective video even when both lesson and release are published',()=>{
 const result=reconcileCanonicalReleases([release],[lesson]);
 assert.equal(result.ok,false);
 assert.deepEqual(result.findings.map(x=>x.code),['RELEASE_CANONICAL_VIDEO_DRIFT']);
});
test('accepts a matching canonical publication',()=>{
 const result=reconcileCanonicalReleases([{...release,package:{lessons:[{canonicalLessonId:'lesson-1',videoUrl:'video-v2.mp4'}]}}],[lesson]);
 assert.equal(result.ok,true);
});
test('rejects missing canonical IDs, duplicates and incomplete media',()=>{
 const broken={...release,package:{lessons:[{canonicalLessonId:'lesson-1',videoUrl:'video-v2.mp4'},{canonicalLessonId:'lesson-1',videoUrl:'video-v2.mp4'},{videoUrl:'unknown'}]}};
 const result=reconcileCanonicalReleases([broken],[{...lesson,video_status:'failed'}]);
 assert.deepEqual(result.findings.map(x=>x.code),['RELEASE_CANONICAL_NOT_READY','RELEASE_DUPLICATE_LESSON_ID','RELEASE_CANONICAL_ID_MISSING']);
});
test('does not mutate source objects or historical releases',()=>{
 const input=structuredClone(release);reconcileCanonicalReleases([release],[lesson]);assert.deepEqual(release,input);
});
