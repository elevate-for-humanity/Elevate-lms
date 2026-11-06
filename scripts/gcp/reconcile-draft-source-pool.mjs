import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'
 ?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const literal=v=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
const quoted=v=>"'"+String(v).replaceAll("'","''")+"'";

/** Produce one atomic, compare-and-swap recovery transaction from a live
 * snapshot. Caller must independently verify the deployed worker image first.
 * No SQL runs from this module and no instruction/media history is discarded. */
export function planDraftSourceReconciliation({build,pool,jobs,imageSha,imageDigest,publicationGuardVersion,now=Date.now()}) {
 assert.match(imageSha??'',/^[a-f0-9]{40}$/,'verified worker commit required');
 assert.match(imageDigest??'',/^sha256:[a-f0-9]{64}$/,'verified immutable image required');
 assert.ok(['draft-recovery-v1','partial-publication-disabled-v1'].includes(publicationGuardVersion),'deployed publication guard required');
 assert.equal(build?.status,'running');assert.equal(build.profile?.ownerPaused,false);
 assert.equal(pool?.build_id,build.id);assert.equal(pool.state,'active');
 assert.equal(pool.profile_hash,hash(pool.profile),'pool snapshot hash mismatch');
 const recovery=build.profile.existingLessonSourceRecovery;
 assert.equal(recovery?.draftSourceForProductionOnly,true);
 assert.equal(recovery?.publicationApproved,false);assert.equal(recovery?.learnerPublicationApproved,false);
 const restored=build.profile.instructionalSources;
 assert.ok(Array.isArray(restored)&&restored.length>0);
 assert.equal((pool.profile.instructionalSources??[]).length,0,'only an empty original source pool may be restored');
 assert.deepEqual({...pool.profile,instructionalSources:restored,existingLessonSourceRecovery:recovery},build.profile,'unrelated profile changes cannot join source recovery');
 const ids=restored.map(s=>s.id);assert.equal(new Set(ids).size,ids.length);
 assert.ok(restored.every(s=>typeof s.text==='string'&&s.text.trim().length>0));
 assert.deepEqual([...ids].sort(),build.profile.competencies.map(c=>c.id).sort(),'every competency requires its exact restored source');
 assert.ok(jobs.length>0&&jobs.every(j=>j.build_id===build.id));
 assert.ok(jobs.every(j=>j.status!=='running'&&!(Date.parse(j.lease_expires_at??'')>now)),'active work must not be replaced');
 const instruction=jobs.filter(j=>j.payload?.autopilot?.role==='instruction');
 assert.equal(instruction.length,ids.length);
 assert.deepEqual(instruction.map(j=>j.payload.autopilot.competencyId).sort(),[...ids].sort());
 assert.ok(instruction.every(j=>j.status==='failed'&&j.last_error==='ULTIMATE_AUTOPILOT_SOURCE_REVISION_REQUIRED'&&
  Number.isSafeInteger(j.execution_generation)&&Number.isSafeInteger(j.attempts)&&j.attempts>=0&&j.attempts<10),
  'only exact failed source-revision generations may resume');
 // The existing deployed release service also rejects partial publication
 // when this flag is false. Keep that independent barrier during rollout.
 const reconciledProfile={...build.profile,publishCompletedLessons:false};
 const newHash=hash(reconciledProfile);
 const delimiter='$source_'+newHash+'$';
 const snapshot=literal({poolProfile:pool.profile,poolHash:pool.profile_hash,previousPublishCompletedLessons:build.profile.publishCompletedLessons,imageSha,imageDigest,publicationGuardVersion});
 assert.ok(!JSON.stringify({build,pool}).includes(delimiter),'source delimiter collision');
 const sql=`BEGIN;
SET LOCAL lock_timeout='5s';
DO ${delimiter}
DECLARE b public.ultimate_course_builds%ROWTYPE; p public.ultimate_autopilot_pools%ROWTYPE; j public.ultimate_build_jobs%ROWTYPE; n integer:=0;
BEGIN
 SELECT * INTO STRICT b FROM public.ultimate_course_builds WHERE id=${quoted(build.id)}::uuid FOR UPDATE;
 SELECT * INTO STRICT p FROM public.ultimate_autopilot_pools WHERE id=${quoted(pool.id)}::uuid FOR UPDATE;
 PERFORM id FROM public.ultimate_build_jobs WHERE build_id=b.id ORDER BY id FOR UPDATE;
 IF b.status<>'running' OR b.profile->>'ownerPaused' IS DISTINCT FROM 'false' OR b.profile IS DISTINCT FROM ${literal(build.profile)} OR
    p.state<>'active' OR p.build_id<>b.id OR p.profile IS DISTINCT FROM ${literal(pool.profile)} OR p.profile_hash<>${quoted(pool.profile_hash)}
 THEN RAISE EXCEPTION 'SOURCE_RECONCILIATION_SNAPSHOT_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM public.ultimate_build_jobs WHERE build_id=b.id AND (status='running' OR lease_expires_at>clock_timestamp()))
 THEN RAISE EXCEPTION 'SOURCE_RECONCILIATION_ACTIVE_LEASE'; END IF;
 IF EXISTS(SELECT 1 FROM public.course_lessons WHERE course_id=b.course_id AND (is_published OR status='published'))
 THEN RAISE EXCEPTION 'SOURCE_RECONCILIATION_PUBLISHED_CONTENT'; END IF;
 IF (SELECT count(*) FROM public.ultimate_build_jobs WHERE build_id=b.id AND payload#>>'{autopilot,role}'='instruction')<>${ids.length}
 THEN RAISE EXCEPTION 'SOURCE_RECONCILIATION_SCOPE_CHANGED'; END IF;
 INSERT INTO public.ultimate_job_attempt_history(job_id,execution_generation,event_type,details)
 SELECT p.coordinator_job_id,execution_generation,'source_pool_revision_archived',${snapshot}
 FROM public.ultimate_build_jobs WHERE id=p.coordinator_job_id;
 UPDATE public.ultimate_course_builds SET profile=${literal(reconciledProfile)},updated_at=now() WHERE id=b.id;
 UPDATE public.ultimate_autopilot_pools SET profile=${literal(reconciledProfile)},profile_hash=${quoted(newHash)},updated_at=now() WHERE id=p.id;
 FOR j IN SELECT * FROM public.ultimate_build_jobs WHERE build_id=b.id AND payload#>>'{autopilot,role}'='instruction' LOOP
  IF j.status<>'failed' OR j.last_error IS DISTINCT FROM 'ULTIMATE_AUTOPILOT_SOURCE_REVISION_REQUIRED' OR j.attempts>=10
  THEN RAISE EXCEPTION 'SOURCE_RECONCILIATION_JOB_CHANGED'; END IF;
  INSERT INTO public.ultimate_job_attempt_history(job_id,execution_generation,event_type,details)
  VALUES(j.id,j.execution_generation,'source_revision_reconciled',jsonb_build_object('previousError',j.last_error,'previousAttempts',j.attempts,'previousPoolHash',p.profile_hash,'newPoolHash',${quoted(newHash)},'imageSha',${quoted(imageSha)},'imageDigest',${quoted(imageDigest)},'publicationApproved',false));
  UPDATE public.ultimate_build_jobs SET status='queued',execution_generation=j.execution_generation+1,
   max_attempts=greatest(max_attempts,attempts+1),available_at=now(),last_error=NULL,
   lease_owner=NULL,lease_expires_at=NULL,heartbeat_at=NULL,updated_at=now(),
   monitor=coalesce(monitor,'{}'::jsonb)||jsonb_build_object('state','awaiting_assignment','sourceReconciliation',jsonb_build_object('oldPoolHash',p.profile_hash,'newPoolHash',${quoted(newHash)},'publicationApproved',false))
   WHERE id=j.id AND execution_generation=j.execution_generation AND status='failed';
  n:=n+1;
 END LOOP;
 IF n<>${ids.length} THEN RAISE EXCEPTION 'SOURCE_RECONCILIATION_COUNT_CHANGED'; END IF;
END ${delimiter};
SELECT status,count(*) FROM public.ultimate_build_jobs WHERE build_id=${quoted(build.id)}::uuid GROUP BY status;
COMMIT;`;
 return {buildId:build.id,sourceCount:ids.length,jobIds:instruction.map(j=>j.id),previousPoolHash:pool.profile_hash,newPoolHash:newHash,publicationApproved:false,publishCompletedLessons:false,sql};
}
