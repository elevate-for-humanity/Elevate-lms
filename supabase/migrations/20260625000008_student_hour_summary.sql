-- student_hour_summary view
-- Per-student breakdown of theory (RTI), lab (OJL), and field (host_shop) hours.
-- Sources: hour_entries (source_type) + progress_entries (verified OJL hours).

CREATE OR REPLACE VIEW public.student_hour_summary AS
SELECT
  he.user_id                                                          AS student_id,
  SUM(CASE WHEN he.source_type = 'rti'       THEN COALESCE(he.hours_claimed, 0) ELSE 0 END) AS theory_hours,
  SUM(CASE WHEN he.source_type = 'ojl'       THEN COALESCE(he.hours_claimed, 0) ELSE 0 END) AS lab_hours,
  SUM(CASE WHEN he.source_type = 'host_shop' THEN COALESCE(he.hours_claimed, 0) ELSE 0 END) AS field_hours,
  SUM(CASE WHEN he.source_type = 'timeclock' THEN COALESCE(he.hours_claimed, 0) ELSE 0 END) AS timeclock_hours,
  SUM(COALESCE(he.hours_claimed, 0))                                  AS total_claimed_hours,
  SUM(CASE WHEN he.status = 'approved'       THEN COALESCE(he.hours_claimed, 0) ELSE 0 END) AS total_approved_hours,
  SUM(CASE WHEN he.status IN ('pending', 'submitted') THEN COALESCE(he.hours_claimed, 0) ELSE 0 END) AS total_pending_hours,
  COUNT(*)                                                            AS entry_count
FROM public.hour_entries he
WHERE he.user_id IS NOT NULL
GROUP BY he.user_id;

GRANT SELECT ON public.student_hour_summary TO authenticated;

-- Also expose verified OJL hours from progress_entries for barber apprentices
CREATE OR REPLACE VIEW public.apprentice_hour_summary AS
SELECT
  pe.apprentice_id                                                    AS student_id,
  SUM(CASE WHEN pe.status = 'verified' THEN COALESCE(pe.hours_worked, 0) ELSE 0 END) AS verified_hours,
  SUM(CASE WHEN pe.status = 'submitted' THEN COALESCE(pe.hours_worked, 0) ELSE 0 END) AS pending_hours,
  SUM(COALESCE(pe.hours_worked, 0))                                   AS total_hours,
  COUNT(*)                                                            AS entry_count
FROM public.progress_entries pe
WHERE pe.apprentice_id IS NOT NULL
GROUP BY pe.apprentice_id;

GRANT SELECT ON public.apprentice_hour_summary TO authenticated;
