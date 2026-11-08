import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {planDraftSourceReconciliation} from '../../scripts/gcp/reconcile-draft-source-pool.mjs';
import {recoveredSourcePublicationAllowed} from '../../lib/ultimate-course-builder/release/recovered-source-policy.mjs';
function fixture(){
 const profile={ownerPaused:false,competencies:[{id:'lesson'}]};
 const pool={id:'pool',build_id:'build',state:'active',profile,profile_hash:createHash('sha256').update(JSON.stringify({competencies:[{id:'lesson'}],ownerPaused:false})).digest('hex')};
 return {build:{id:'build',status:'running',profile:{...profile,instructionalSources:[{id:'lesson',text:"Owner's restored draft"}],existingLessonSourceRecovery:{draftSourceForProductionOnly:true,publicationApproved:false,learnerPublicationApproved:false}}},pool,
 jobs:[{id:'instruction',build_id:'build',status:'failed',attempts:2,execution_generation:3,last_error:'ULTIMATE_AUTOPILOT_SOURCE_REVISION_REQUIRED',payload:{autopilot:{role:'instruction',competencyId:'lesson'}}}],
 imageSha:'a'.repeat(40),imageDigest:'sha256:'+'b'.repeat(64),publicationGuardVersion:'draft-recovery-v1'};
}
test('plans exact draft-source recovery while retaining publication refusal',()=>{
 const f=fixture();const plan=planDraftSourceReconciliation(f);
 assert.equal(plan.sourceCount,1);assert.equal(plan.publicationApproved,false);
 assert.equal(plan.publishCompletedLessons,false);
 assert.deepEqual(plan.jobIds,['instruction']);assert.notEqual(plan.newPoolHash,plan.previousPoolHash);
 // Source reconciliation still preserves the snapshot, but the removed
 // publication restriction no longer forces publishCompletedLessons=false.
 assert.equal(recoveredSourcePublicationAllowed(f.build.profile),true);
 assert.match(plan.sql,/Owner''s restored draft/);
});
test('the independently deployed partial-publication guard also requires publication disabled',()=>{
 const f=fixture();f.publicationGuardVersion='partial-publication-disabled-v1';
 assert.equal(planDraftSourceReconciliation(f).publishCompletedLessons,false);
});
test('rejects changed, published, leased, unrelated and incomplete source snapshots before any recovery',()=>{
 for(const mutate of [f=>f.build.status='published',f=>f.build.profile.ownerPaused=true,
  f=>f.jobs[0].status='running',f=>f.jobs[0].lease_expires_at='2999-01-01',
  f=>f.jobs[0].last_error='OTHER_FAILURE',f=>f.jobs[0].attempts=10,
  f=>f.build.profile.instructionalSources[0].id='other',f=>f.build.profile.instructionalSources[0].text='',
  f=>f.build.profile.other='unrelated',f=>f.pool.profile_hash='0'.repeat(64),
  f=>f.publicationGuardVersion='old-worker',f=>f.imageDigest='mutable-tag']) {
  const f=fixture();mutate(f);assert.throws(()=>planDraftSourceReconciliation(f));
 }
});
