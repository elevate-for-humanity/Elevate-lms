-- Source: Dr. Carlina A. Wilkes instructor-issued master syllabus v2.0,
-- and updated eight-week guide, inspected November 1, 2026.
-- 10 modules sum to 160; 8 weekly allocations each sum to 20.
-- Preserve course video/lesson durations, enrollment status and all learner evidence.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.programs
    WHERE id = 'bd503ebf-d8e1-4c79-9efe-a72c001589b4' AND slug = 'bookkeeping'
      AND ((training_hours = 640 AND total_hours = 150)
        OR (training_hours = 160 AND total_hours = 160))
  ) THEN
    RAISE EXCEPTION 'Bookkeeping source values changed; inspect before reconciliation';
  END IF;
END $$;
UPDATE public.programs
SET training_hours = 160,
    total_hours = 160,
    estimated_hours = 160,
    duration_hours = 160,
    hours = 160,
    duration_weeks = 8,
    schedule = '8 weeks, 20 instructional hours per week; 160 instructional hours total',
    lms_config = coalesce(lms_config, '{}'::jsonb) ||
      jsonb_build_object('instructional_schedule_source', '{"source":"Dr. Carlina A. Wilkes master syllabus v2.0 (2026) pp. 2–4; updated eight-week guide pp. 4 and 8","verified_on":"2026-11-01","method":"Authenticated email attachment PDF viewer; visual module/weekly table inspection","message_ids":["be8b41ae-76db-4665-a202-aa52b7abe5cb","f13aef8e-46bb-4b62-be16-4bda96538db5"],"total_instructional_hours":160,"weeks":8,"hours_per_week":20,"module_hours":[{"title":"Accounting and Bookkeeping Foundations","hours":15},{"title":"Debits, Credits, Journals and Ledgers","hours":20},{"title":"Cash, Assets and Sales Transactions","hours":20},{"title":"Purchases, Liabilities and Equity","hours":20},{"title":"Adjustments and the Accounting Cycle","hours":15},{"title":"Reconciliation and Error Correction","hours":15},{"title":"Financial Statements and Analysis","hours":15},{"title":"Payroll, Controls and Bookkeeping Operations","hours":10},{"title":"Excel for Accounting Laboratories","hours":15},{"title":"Capstone, Remediation and Exam Preparation","hours":15}],"weekly_module_hours":[[15,5,0,0,0,0,0,0,0,0],[0,15,5,0,0,0,0,0,0,0],[0,0,15,5,0,0,0,0,0,0],[0,0,0,15,5,0,0,0,0,0],[0,0,0,0,10,10,0,0,0,0],[0,0,0,0,0,5,15,0,0,0],[0,0,0,0,0,0,0,10,10,0],[0,0,0,0,0,0,0,0,5,15]],"prior_program_hours":{"training_hours":640,"total_hours":150,"estimated_hours":null,"hours":0,"duration_hours":null},"scope":"Instructional delivery schedule only; not learner-earned hours, exam awards, or government approval"}'::jsonb)
WHERE id = 'bd503ebf-d8e1-4c79-9efe-a72c001589b4' AND slug = 'bookkeeping';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.programs
    WHERE id = 'bd503ebf-d8e1-4c79-9efe-a72c001589b4'
      AND training_hours = 160 AND total_hours = 160 AND hours = 160
      AND estimated_hours = 160 AND duration_hours = 160 AND duration_weeks = 8
      AND (SELECT sum((m->>'hours')::int)
           FROM jsonb_array_elements(lms_config->'instructional_schedule_source'->'module_hours') m) = 160
  ) THEN RAISE EXCEPTION 'Bookkeeping schedule verification failed'; END IF;
END $$;
COMMIT;
