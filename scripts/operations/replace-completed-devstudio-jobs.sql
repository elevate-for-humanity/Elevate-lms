-- Owner-authorized replacement of historical completed Dev Studio records.
-- Keep the old rows and all original fields for audit/rollback; never replay
-- historical commands automatically. Replacements require a verified replan.
-- Running this transaction again does not duplicate the replaced rows.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('replace-completed-devstudio-jobs-20261107'));
WITH source AS MATERIALIZED (
  SELECT j.*, gen_random_uuid() AS replacement_id, to_jsonb(j) AS snapshot
  FROM public.devstudio_jobs j
  WHERE j.status = 'completed'
    AND j.created_at < '2026-11-08T00:00:00Z'::timestamptz
    AND NOT (coalesce(j.tool_args, '{}'::jsonb) ? 'replacement_batch')
  FOR UPDATE
), replacement AS (
  INSERT INTO public.devstudio_jobs (
    id, user_id, command, status, tool_name, tool_args, log_lines,
    stage, progress, result, error, attempts, idempotency_key
  )
  SELECT replacement_id, user_id, command, 'queued', tool_name,
    jsonb_build_object('replaces_job_id', id, 'original_tool_args', tool_args,
      'replacement_batch', '20261107-verified-execution',
      'requires_verified_replan', true, 'automatic_replay_authorized', false),
    jsonb_build_array('Replacement created. Original history preserved. Execution has not started; a verified replan is required.'),
    'awaiting_verified_replan', 0, NULL, NULL, 0,
    'replacement:20261107:' || id::text
  FROM source
  RETURNING id, tool_args
), retired AS (
  UPDATE public.devstudio_jobs j SET
    status = 'cancelled', stage = 'superseded', updated_at = now(),
    tool_args = jsonb_build_object('replacement_job_id', r.id,
      'replacement_batch', '20261107-verified-execution',
      'archived_snapshot', s.snapshot)
  FROM source s JOIN replacement r ON r.id = s.replacement_id
  WHERE j.id = s.id AND j.status = 'completed'
  RETURNING j.id
)
SELECT (SELECT count(*) FROM replacement) AS new_jobs,
       (SELECT count(*) FROM retired) AS superseded_jobs;
COMMIT;
