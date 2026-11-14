# Pending Supabase migrations (dashboard apply)

Migrations in the repo are **not** auto-applied. Use the SQL Editor on project `cuxzzpsyufcewtmicszk`.

## Required order (minimum for LMS gating + July hardening)

| Order | File | Purpose |
|------:|------|---------|
| 1 | `20260327000003_checkpoint_gating.sql` | `checkpoint_scores`, `step_submissions`, `program_completion_certificates`, `lms_lessons` |
| 2 | `20260601000006_step_submissions_review_columns.sql` | Instructor review columns on `step_submissions` |
| 3 | `20260702000001` … `20260702000014` | RLS/storage hardening, store, AI, workflow, testing center |
| 4 | `20260702000009_normalize_two_factor_auth.sql` | 2FA column merge + constraints |
| 5 | `20260702000010_onboarding_progress_unique.sql` | Unique `(user_id, step)` for onboarding upsert |
| 6 | `20260702000011_ensure_storage_buckets.sql` | Idempotent storage buckets |
| 7 | `20260702000012_external_courses_support_fee.sql` | External course fee columns |
| 8 | `20260530100001_lms_checkpoint_certificate_rpc.sql` | `record_checkpoint_attempt` RPC + insert policies |

## Verify after apply

```sql
SELECT proname FROM pg_proc WHERE proname = 'record_checkpoint_attempt';

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'two_factor_auth'
  AND column_name IN ('enabled', 'is_enabled');

SELECT conname FROM pg_constraint
WHERE conrelid = 'public.onboarding_progress'::regclass
  AND conname = 'onboarding_progress_user_step_unique';
```

## FORCE ROW SECURITY

Do **not** enable `FORCE ROW SECURITY` on `checkpoint_scores` or `program_completion_certificates` until all admin remediation paths use RPCs or learner-scoped policies. See `AGENTS.md` governance section.
