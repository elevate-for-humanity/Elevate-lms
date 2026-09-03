-- 20260629000001_performance_indexes.sql
-- 9 indexes for admin dashboard query paths that were doing full-table scans.
-- NOTE: CONCURRENTLY removed (exec_sql runs in implicit transaction).
--       Re-apply manually with CONCURRENTLY via Supabase Dashboard if write-lock duration is a concern.
-- All are so they build without locking writes.

-- program_enrollments: revenue queries filter by payment_status
CREATE INDEX IF NOT EXISTS idx_pe_payment_status
  ON public.program_enrollments (payment_status);

CREATE INDEX IF NOT EXISTS idx_pe_payment_status_created
  ON public.program_enrollments (payment_status, created_at);

-- program_enrollments: enrollment trend and active-count queries filter by created_at
CREATE INDEX IF NOT EXISTS idx_pe_created_at
  ON public.program_enrollments (created_at);

-- program_enrollments: active-state + created_at (used by last-month delta)
CREATE INDEX IF NOT EXISTS idx_pe_state_created
  ON public.program_enrollments (enrollment_state, created_at);

-- program_enrollments: partial index for active-only lookups (inactive learner scan)
CREATE INDEX IF NOT EXISTS idx_pe_state_user
  ON public.program_enrollments (enrollment_state, user_id)
  WHERE enrollment_state = 'active';

-- leads: stale-leads filter on updated_at had no index
CREATE INDEX IF NOT EXISTS idx_leads_updated_at
  ON public.leads (updated_at);

-- enrollment_funding_records: participant_report LATERAL join
CREATE INDEX IF NOT EXISTS idx_efr_enrollment_created
  ON public.enrollment_funding_records (enrollment_id, created_at);

-- placement_records: participant_report LATERAL join
CREATE INDEX IF NOT EXISTS idx_placement_learner_start
  ON public.placement_records (learner_id, start_date);

-- program_completion_certificates: participant_report LATERAL join
CREATE INDEX IF NOT EXISTS idx_pcc_user_program
  ON public.program_completion_certificates (user_id, program_id);

-- applications: stalled-applications query (partial — only non-terminal statuses)
CREATE INDEX IF NOT EXISTS idx_applications_status_created
  ON public.applications (status, created_at)
  WHERE status NOT IN ('approved', 'rejected', 'enrolled', 'withdrawn');
