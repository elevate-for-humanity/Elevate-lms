import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerApprovedPreview} from './owner-approved-preview.mjs';
function fixture(){
 const sha256='a'.repeat(64),storagePath='generated-lessons/lesson-canonical-approved.mp4';
 const build={course_id:'course',profile:{canonicalLessonIds:{competency:'canonical'},presentationContract:{approvedReferenceVideo:{storagePath,sha256}}}};
 const lesson={id:'lesson-build',competency_id:'competency',artifacts:{lesson_film_render:{render:{videoUrl:'https://media.example/new-unapproved-draft.mp4'}}}};
 const published={id:'canonical',course_id:'course',approved:true,is_published:true,media_quality_status:'approved',video_url:'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/'+storagePath,media_quality_evidence:{reviewMode:'explicit-owner-approval',reviewerId:'owner',sourceLessonBuildId:'lesson-build',mediaSha256:sha256,sourceArtifactVersion:25,decodedDurationSeconds:351.318,automatedAcceptanceComplete:false}};
 const filters=[];const db={from(table){assert.equal(table,'course_lessons');return {select(){return this;},eq(k,v){filters.push([k,v]);return this;},async maybeSingle(){return {data:published};}};}};
 return {build,lesson,published,db,filters};
}
test('returns the exact owner-approved published film even when a newer draft exists, without inventing automated QA',async()=>{
 const f=fixture(),result=await ownerApprovedPreview(f.db,f.build,f.lesson);
 assert.equal(result.videoUrl,f.published.video_url);assert.equal(result.version,25);assert.equal(result.durationSeconds,351.318);assert.equal(result.automatedAcceptanceComplete,false);
 assert.deepEqual(f.filters,[['id','canonical'],['course_id','course']]);
});
for(const [name,change] of [
 ['unapproved lesson',f=>f.published.approved=false],['unpublished lesson',f=>f.published.is_published=false],
 ['automatic review',f=>f.published.media_quality_evidence.reviewMode='automated'],['missing approver',f=>delete f.published.media_quality_evidence.reviewerId],
 ['different file hash',f=>f.published.media_quality_evidence.mediaSha256='b'.repeat(64)],['different lesson build',f=>f.published.media_quality_evidence.sourceLessonBuildId='other'],
 ['missing version',f=>delete f.published.media_quality_evidence.sourceArtifactVersion],['foreign origin',f=>f.published.video_url=f.published.video_url.replace('cuxzzpsyufcewtmicszk.supabase.co','attacker.example')],
 ['different saved path',f=>f.published.video_url+='changed'],['missing canonical mapping',f=>f.build.profile.canonicalLessonIds={}],
])test('never confers approval on '+name,async()=>{const f=fixture();change(f);assert.equal(await ownerApprovedPreview(f.db,f.build,f.lesson),null);});
