-- Reconcile PARIS's existing bounded context-recovery policy with its live
-- attempt counter. Preserve the two-attempt default and require an explicit
-- recovery history marker for a third attempt on SOURCE-FREE repairs only.
-- No job records, attempts, retry states, worker leases or owner pauses changed.
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.paris_code_repairs
  DROP CONSTRAINT paris_code_repairs_attempt_count_check,
  ADD CONSTRAINT paris_code_repairs_attempt_count_check CHECK (
    attempt_count BETWEEN 0 AND 2
    OR (
      attempt_count = 3
      AND source_job_id IS NULL
      AND (
        attempt_history @> '[{"retryReason":"bounded-cpu-edit-recovery"}]'::jsonb
        OR attempt_history @> '[{"retryReason":"bounded-context-budget-recovery"}]'::jsonb
      )
    )
  );
