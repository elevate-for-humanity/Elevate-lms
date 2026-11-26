-- One additional audited attempt for a PARIS repair whose attempts all failed
-- before any repository write, the last at the GitHub App branch-creation
-- credential wall (GITHUB_APP_403_BRANCH), now that the installation's
-- Contents: write grant is live. The monitor records retryReason
-- 'verified-github-app-recovery' only after a fresh App token diagnostic
-- proves Contents write authority, and only for rows whose recorded failures
-- are all infrastructure-class with zero writes (no branch sha, no release).
-- Elizabeth approved this narrow exception under her blanket fix order of
-- 2026-11-25, including for source-linked repairs; the historical bounded
-- CPU/context and zero-write exceptions remain source-free and unchanged.
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
        OR attempt_history @> '[{"retryReason":"verified-github-app-recovery"}]'::jsonb
      )
    )
    OR (
      attempt_count = 3
      AND attempt_history @> '[{"retryReason":"verified-github-app-recovery"}]'::jsonb
      AND NOT (attempt_history @? '$[*].sha')
      AND NOT (candidate @? '$.branch.sha')
    )
  );
