-- Resume only after the tested contextual-picture timing worker is deployed.
-- This preserves completed instruction, generated media, attempt history and
-- live worker leases. It never sets any media approval/publication flags.
begin;
set local lock_timeout='5s';
do $$ begin
 if not exists(select 1 from public.ultimate_autopilot_runtime where image_sha='99d90bbd0641a788d9413dc4ed7a019c6676d80b') then raise exception 'Verified contextual-picture timing worker is not deployed'; end if;
 if not exists(select 1 from public.ultimate_course_builds b join public.ultimate_autopilot_pools p on p.build_id=b.id where b.id='88b2275e-ab36-4aad-b696-c5ebe491fd4e' and b.profile=p.profile and coalesce(b.profile->>'ownerPaused','false')<>'true') then raise exception 'Immutable source profile must match and course must be resumed'; end if;
end $$;
update public.ultimate_build_jobs j set
 status=case when j.status='failed' then 'queued' else j.status end,
 max_attempts=greatest(coalesce((j.monitor->>'restartRetryLimit')::integer,j.max_attempts),j.attempts+1),
 available_at=case when j.status in ('queued','failed') then now() else j.available_at end,
 execution_generation=j.execution_generation+case when j.status='failed' then 1 else 0 end,
 last_error=case when j.status='failed' then null else j.last_error end,
 monitor=(j.monitor-'awaitingRepairImage'-'restartRetryLimit')||jsonb_build_object('lastTimingRepair',jsonb_build_object('imageSha',r.image_sha,'imageDigest',r.image_digest,'previousError',j.last_error,'at',now())),
 updated_at=now()
from public.ultimate_autopilot_runtime r
where j.build_id='88b2275e-ab36-4aad-b696-c5ebe491fd4e'
 and j.job_type like '%:media'
 and j.monitor->>'awaitingRepairImage'='99d90bbd0641a788d9413dc4ed7a019c6676d80b'
 and r.image_sha='99d90bbd0641a788d9413dc4ed7a019c6676d80b'
 and (j.status<>'failed' or j.lease_owner is null or j.lease_expires_at<=now());
commit;
select status,count(*) jobs from public.ultimate_build_jobs
where build_id='88b2275e-ab36-4aad-b696-c5ebe491fd4e' and job_type like '%:media' group by status;
