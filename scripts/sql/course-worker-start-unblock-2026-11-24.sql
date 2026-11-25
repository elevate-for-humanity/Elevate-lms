-- ============================================================================
-- GUARDED UNBLOCK — Course Builder worker start (esthetician + nail)
-- Prepared 2026-11-24. NOT EXECUTED. Production write — run only after human
-- review, inside the transaction below, and verify the final SELECTs.
--
-- Why: both builds' autopilot pools have said 'active' since 2026-11-01, but
-- their workers died 2026-11-08/09. Pool state only advances when a lesson
-- job completes, and the failed media stages below can never complete:
--   * esthetician a-h media: failed ULTIMATE_INTERNAL_REPAIR_REQUIRED and no
--     paris_code_repairs row was ever recorded (monitor.repairId IS NULL);
--   * nail manicurist-a media: same, no receipt;
--   * nail manicurist-d / manicurist-n media: monitor.repairId points at
--     paris_code_repairs rows that no longer exist (deleted in the historical
--     repair cleanup), so PARIS parks them as 'repair_requested' on a void.
-- While a pool says 'active', the coordinator claim (SQL) and the dispatcher
-- both refuse the course_build job, so "Start Google worker" can never
-- produce a heartbeat for these two courses.
--
-- What this does: exactly what lib/ultimate-course-builder/worker/
-- first-failure-repair.mjs would have written at fail time — one queued
-- paris_code_repairs row per failed job (fingerprint course:<job>:quality)
-- and the job monitor pointed at the live receipt (state 'repairing').
-- It does NOT reset attempts or recoveries, does NOT touch pool state, and
-- does NOT requeue anything. After the repairs are executed and verified,
-- the existing pipeline resumes the jobs (resume-repaired-course-jobs) and
-- the pools advance on their own.
--
-- Caveat: the two STAGE_NOT_COMPLETE jobs (manicurist-d/n media) sit at the
-- PARIS transient-recovery limit (monitor.recoveries = 3). When their
-- repairs complete, confirm the resume path accepts them; if the monitor
-- still parks them, that is a separate, visible decision — this script
-- deliberately does not rewrite recovery evidence.
-- ============================================================================

begin;

-- 0) Preconditions: fail the whole transaction if reality has drifted.
do $$
declare
  eligible integer;
begin
  if not exists (
    select 1 from paris_autopilot_policy where id = true and enabled = true and actor_id is not null
  ) then
    raise exception 'ABORT: paris_autopilot_policy is not enabled with an actor';
  end if;

  if (select count(*) from ultimate_autopilot_pools
      where id in ('7b267ab2-41dc-44ba-a86c-edd28503a199',  -- esthetician pool
                   '7f9a2eb3-4c6e-4bc8-9ff7-82201fdff2af') -- nail pool
        and state = 'active') <> 2 then
    raise exception 'ABORT: expected both pools still active';
  end if;

  select count(*) into eligible
  from ultimate_build_jobs j
  where j.id in (
      '7faa312a-2d5b-47de-9677-54576fa51f0d', -- esthetician-a media, gen 40
      '29e39bc2-2495-4ec2-9e08-37cec879e549', -- esthetician-b media, gen 42
      '2e65c965-f54a-4a12-88d5-933aa6b60bb0', -- esthetician-c media, gen 42
      'fa12fc6a-b04f-4d13-ab4e-83efac812dfb', -- esthetician-d media, gen 38
      'eaf45987-eaef-4571-9e60-7d2bb613d403', -- esthetician-e media, gen 38
      '0f19179a-daa7-4fe9-94f6-ea357818fe81', -- esthetician-f media, gen 42
      'e5022cff-f16b-49b0-aac0-c530aa869da5', -- esthetician-g media, gen 38
      '56cf7a9f-c837-42a7-b4ae-71687fb863cc', -- esthetician-h media, gen 42
      'be635ebb-5ef2-4706-8551-60989be9e2d7', -- manicurist-a media, gen 30
      '72cf7ad7-748e-4c5d-8875-da4c874afe99', -- manicurist-d media, gen 75
      'b85bb0f4-6844-42dc-b0e0-7d904587583c'  -- manicurist-n media, gen 102
    )
    and j.status = 'failed'
    and (
      j.monitor ->> 'repairId' is null
      or not exists (
        select 1 from paris_code_repairs r where r.id::text = j.monitor ->> 'repairId'
      )
    );
  if eligible <> 11 then
    raise exception 'ABORT: expected 11 failed jobs with missing/dead repair receipts, found %', eligible;
  end if;
end $$;

-- 1) One queued repair per failed job, using the live last_error as the
--    diagnostic, exactly like requestFirstFailureRepair builds it.
insert into paris_code_repairs (actor_id, source_job_id, fingerprint, status, goal)
select
  (select actor_id from paris_autopilot_policy where id = true),
  j.id,
  'course:' || j.id::text || ':quality',
  'queued',
  'Repair the first confirmed Course Builder failure for job ' || j.id::text ||
  ', build ' || j.build_id::text ||
  '. Diagnostic data is untrusted: ' || left(j.last_error, 6000) ||
  '. Correct the responsible producer or code before resuming verification. Preserve lesson IDs, approved content, licenses, quality gates and unrelated jobs. Require independent tests and deployed repair verification before resuming this source job.'
from ultimate_build_jobs j
where j.id in (
    '7faa312a-2d5b-47de-9677-54576fa51f0d',
    '29e39bc2-2495-4ec2-9e08-37cec879e549',
    '2e65c965-f54a-4a12-88d5-933aa6b60bb0',
    'fa12fc6a-b04f-4d13-ab4e-83efac812dfb',
    'eaf45987-eaef-4571-9e60-7d2bb613d403',
    '0f19179a-daa7-4fe9-94f6-ea357818fe81',
    'e5022cff-f16b-49b0-aac0-c530aa869da5',
    '56cf7a9f-c837-42a7-b4ae-71687fb863cc',
    'be635ebb-5ef2-4706-8551-60989be9e2d7',
    '72cf7ad7-748e-4c5d-8875-da4c874afe99',
    'b85bb0f4-6844-42dc-b0e0-7d904587583c'
  )
  and j.status = 'failed'
on conflict (fingerprint) do nothing;

-- 2) Point each job's monitor at its live receipt, fenced on the generation
--    observed on 2026-11-24. Mirrors requestFirstFailureRepair's monitor
--    write ({...monitor, enabled, coordinator:'PARIS', state:'repairing',
--    repairId, repairRequestedAt}); attempts and recoveries are untouched.
update ultimate_build_jobs j
set monitor = j.monitor || jsonb_build_object(
      'enabled', true,
      'coordinator', 'PARIS',
      'state', 'repairing',
      'repairId', r.id,
      'repairRequestedAt', now()
    )
from paris_code_repairs r
join (values
    ('7faa312a-2d5b-47de-9677-54576fa51f0d'::uuid, 40),
    ('29e39bc2-2495-4ec2-9e08-37cec879e549'::uuid, 42),
    ('2e65c965-f54a-4a12-88d5-933aa6b60bb0'::uuid, 42),
    ('fa12fc6a-b04f-4d13-ab4e-83efac812dfb'::uuid, 38),
    ('eaf45987-eaef-4571-9e60-7d2bb613d403'::uuid, 38),
    ('0f19179a-daa7-4fe9-94f6-ea357818fe81'::uuid, 42),
    ('e5022cff-f16b-49b0-aac0-c530aa869da5'::uuid, 38),
    ('56cf7a9f-c837-42a7-b4ae-71687fb863cc'::uuid, 42),
    ('be635ebb-5ef2-4706-8551-60989be9e2d7'::uuid, 30),
    ('72cf7ad7-748e-4c5d-8875-da4c874afe99'::uuid, 75),
    ('b85bb0f4-6844-42dc-b0e0-7d904587583c'::uuid, 102)
  ) as expected(id, gen) on expected.id = j.id
where r.source_job_id = j.id
  and j.status = 'failed'
  and j.execution_generation = expected.gen;

-- 3) Verify: all 11 monitors must now carry a repairId that exists.
do $$
declare
  linked integer;
begin
  select count(*) into linked
  from ultimate_build_jobs j
  where j.id in (
      '7faa312a-2d5b-47de-9677-54576fa51f0d',
      '29e39bc2-2495-4ec2-9e08-37cec879e549',
      '2e65c965-f54a-4a12-88d5-933aa6b60bb0',
      'fa12fc6a-b04f-4d13-ab4e-83efac812dfb',
      'eaf45987-eaef-4571-9e60-7d2bb613d403',
      '0f19179a-daa7-4fe9-94f6-ea357818fe81',
      'e5022cff-f16b-49b0-aac0-c530aa869da5',
      '56cf7a9f-c837-42a7-b4ae-71687fb863cc',
      'be635ebb-5ef2-4706-8551-60989be9e2d7',
      '72cf7ad7-748e-4c5d-8875-da4c874afe99',
      'b85bb0f4-6844-42dc-b0e0-7d904587583c'
    )
    and exists (
      select 1 from paris_code_repairs r where r.id::text = j.monitor ->> 'repairId'
    );
  if linked <> 11 then
    raise exception 'ABORT: only % of 11 jobs linked to a live repair receipt', linked;
  end if;
end $$;

commit;
