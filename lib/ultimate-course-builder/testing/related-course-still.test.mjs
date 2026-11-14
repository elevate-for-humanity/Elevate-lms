import test from 'node:test';
import assert from 'node:assert/strict';
import {relatedCourseStillBinding,selectedStillBinding} from '../adapters/selected-course-stills.mjs';

const context={courseId:'course',lessonId:'lesson',sceneId:'scene',cueIndex:3,narrationQuote:'Clean salon tools'};
const asset=(id,action)=>({id,course_id:'course',status:'ready',asset_role:'source_broll',storage_path:id+'.mp4',entitlement_id:'license',licensed_media_entitlements:{license_document_url:'https://license.test/item',metadata:{visual_observation:{method:'sampled-frame-inspection',reviewedAt:'2026-10-03',contentSha256:id.repeat(64),visibleActions:[action],sampleFractions:[0.05,0.35]}}}});
test('next-best course illustration uses an inspected licensed frame without an exact cue selection',()=>{
 const a=asset('a','Classroom'),b=asset('b','Clean salon tools');
 assert.equal(selectedStillBinding([a,b],context),null);
 const chosen=relatedCourseStillBinding([a,b],context);
 assert.equal(chosen.row.id,'b');assert.equal(chosen.choice.sampleFraction,0.05);
 assert.equal(chosen.choice.narrationQuote,context.narrationQuote);
});
test('distinct frames remain available across cues and exhausted frames are excluded',()=>{
 const b=asset('b','Clean salon tools'),used=new Set(['b'.repeat(64)+':0.05']);
 assert.equal(relatedCourseStillBinding([b],context,used).choice.sampleFraction,0.35);
 used.add('b'.repeat(64)+':0.35');assert.equal(relatedCourseStillBinding([b],context,used),null);
});
test('fallback excludes foreign courses, inactive sources, missing rights and uninspected bytes',()=>{
 for(const change of [r=>r.course_id='other',r=>r.status='pending',r=>r.asset_role='render',r=>r.entitlement_id=null,r=>r.licensed_media_entitlements.license_document_url=null,r=>r.licensed_media_entitlements.metadata.visual_observation.contentSha256='invalid',r=>r.licensed_media_entitlements.metadata.visual_observation.reviewedAt='invalid',r=>r.licensed_media_entitlements.metadata.visual_observation.visibleActions=[],r=>r.licensed_media_entitlements.metadata.visual_observation.sampleFractions=[NaN,-1,1.1,'0.5']]){
  const row=asset('b','Clean salon tools');change(row);assert.equal(relatedCourseStillBinding([row],context),null);
 }
});
