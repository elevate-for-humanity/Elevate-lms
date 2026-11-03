-- Preserve the two-attempt limit except for a source-free repair whose
-- signed monitor recorded recovery of a verified legacy CPU edit timeout.
alter table public.paris_code_repairs
  drop constraint paris_code_repairs_attempt_count_check,
  add constraint paris_code_repairs_attempt_count_check check (
    attempt_count between 0 and 2
    or (
      attempt_count = 3
      and source_job_id is null
      and attempt_history @> '[{"retryReason":"bounded-cpu-edit-recovery"}]'::jsonb
    )
  );
