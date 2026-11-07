-- One additional audited attempt for a source-free PARIS planner that did not
-- write or commit code. The existing bounded CPU/context exceptions remain.
-- Do not change historical attempts, status, source approval or worker leases.
ALTER TABLE public.paris_code_repairs
  DROP CONSTRAINT IF EXISTS paris_code_repairs_attempt_count_check;

ALTER TABLE public.paris_code_repairs
  ADD CONSTRAINT paris_code_repairs_attempt_count_check
  CHECK (
    (attempt_count >= 0 AND attempt_count <= 2)
    OR (
      attempt_count = 3
      AND source_job_id IS NULL
      AND (
        attempt_history @> '[{"retryReason":"bounded-cpu-edit-recovery"}]'::jsonb
        OR attempt_history @> '[{"retryReason":"bounded-context-budget-recovery"}]'::jsonb
        OR attempt_history @> '[{"retryReason":"zero-write-planner-v2"}]'::jsonb
      )
    )
  );
