-- Admin hours backfill — Reese (cosmetology) + Logan (program TBD)
-- Run in the Supabase SQL Editor ONLY after looking up the real IDs.
-- Preferred path is POST /api/admin/hours/backfill (admin-only); this file
-- is the fallback for an admin working directly in SQL.
--
-- HOW TO RUN
--   1. Run the two phone lookups in section 1 and note the profile ids.
--   2. Run the apprentice/program lookups in section 2 and note
--      apprentice_id + program_id (+ partner_id from the most recent entry).
--   3. Replace the <PLACEHOLDERS> in section 3 with those ids and your own
--      admin user id, then run section 3.
--   4. Re-run the duplicate check in section 4: it must return 0 rows for
--      each date before you insert, and the section-3 statements refuse to
--      insert when a row already exists (NOT EXISTS guard).
--
-- Hours are EXACTLY as the students reported them (2026-11-23). No lunch
-- was reported for any shift, so none is deducted. November dates are EST
-- (UTC-05:00). Do NOT invent or change any time.
--   Reese  Nov 19  09:55-17:35  7.67h  week ending 2026-11-21
--   Reese  Nov 21  09:00-17:30  8.50h  week ending 2026-11-21
--   Reese  Nov 23  09:00-15:20  6.33h  week ending 2026-11-28
--   Logan  Nov 20  09:00-18:00  9.00h  week ending 2026-11-21
--   Logan  Nov 23  09:00-18:00  9.00h  week ending 2026-11-28
--   Reese total 22.50h; Logan total 18.00h. Reese did NOT go in Nov 20.

-- ── 1) Look up the students by phone (formatting varies) ──────────────
select id, full_name, email, phone
from profiles
where regexp_replace(phone, '\D', '', 'g') like '%2694795318'; -- Reese

select id, full_name, email, phone
from profiles
where regexp_replace(phone, '\D', '', 'g') like '%7654769571'; -- Logan

-- ── 2) Apprentice + program (+ partner from the most recent entry) ─────
-- Replace <REESE_USER_ID> / <LOGAN_USER_ID> with the ids from section 1.
select id as apprentice_id, user_id, program_id, status
from apprentices
where user_id in ('<REESE_USER_ID>', '<LOGAN_USER_ID>')
order by created_at desc;

select id as program_id, slug, name
from programs
where slug = 'cosmetology-apprenticeship'; -- Reese's program

-- Logan's program is to-be-confirmed: use the program_id from his
-- apprentice row above. If he has no apprentice row, enroll him first
-- and do not insert his hours yet.

-- Most recent partner for each apprentice (timeclock stamps partner_id
-- from the host shop; null when there is no earlier entry):
select apprentice_id, partner_id, work_date
from progress_entries
where apprentice_id in ('<REESE_APPRENTICE_ID>', '<LOGAN_APPRENTICE_ID>')
order by work_date desc
limit 2;

-- ── 3) Insert (replace ALL placeholders first) ─────────────────────────
-- Verified-by: your own admin user id. Source note documents provenance.
-- Reese — cosmetology-apprenticeship.
insert into progress_entries
  (apprentice_id, partner_id, program_id, status, work_date, week_ending,
   hours_worked, clock_in_at, clock_out_at, tasks_completed, notes,
   verified_by, verified_at)
select '<REESE_APPRENTICE_ID>', NULL /* partner id from section 2 when known */, '<REESE_PROGRAM_ID>',
  'verified', '2026-11-19', '2026-11-21', 7.67,
  '2026-11-19T09:55:00-05:00'::timestamptz, '2026-11-19T17:35:00-05:00'::timestamptz,
  'Admin backfill — student-reported hours recorded while the student could not sign in.',
  'Admin backfill. Source: student-reported via text to Elizabeth, 2026-11-23. Student-reported 09:55–17:35 (America/Indiana/Indianapolis).',
  '<ADMIN_USER_ID>', now()
where not exists (
  select 1 from progress_entries
  where apprentice_id = '<REESE_APPRENTICE_ID>'
    and program_id = '<REESE_PROGRAM_ID>'
    and work_date = '2026-11-19'
);

insert into progress_entries
  (apprentice_id, partner_id, program_id, status, work_date, week_ending,
   hours_worked, clock_in_at, clock_out_at, tasks_completed, notes,
   verified_by, verified_at)
select '<REESE_APPRENTICE_ID>', NULL /* partner id from section 2 when known */, '<REESE_PROGRAM_ID>',
  'verified', '2026-11-21', '2026-11-21', 8.50,
  '2026-11-21T09:00:00-05:00'::timestamptz, '2026-11-21T17:30:00-05:00'::timestamptz,
  'Admin backfill — student-reported hours recorded while the student could not sign in.',
  'Admin backfill. Source: student-reported via text to Elizabeth, 2026-11-23. Student-reported 09:00–17:30 (America/Indiana/Indianapolis).',
  '<ADMIN_USER_ID>', now()
where not exists (
  select 1 from progress_entries
  where apprentice_id = '<REESE_APPRENTICE_ID>'
    and program_id = '<REESE_PROGRAM_ID>'
    and work_date = '2026-11-21'
);

insert into progress_entries
  (apprentice_id, partner_id, program_id, status, work_date, week_ending,
   hours_worked, clock_in_at, clock_out_at, tasks_completed, notes,
   verified_by, verified_at)
select '<REESE_APPRENTICE_ID>', NULL /* partner id from section 2 when known */, '<REESE_PROGRAM_ID>',
  'verified', '2026-11-23', '2026-11-28', 6.33,
  '2026-11-23T09:00:00-05:00'::timestamptz, '2026-11-23T15:20:00-05:00'::timestamptz,
  'Admin backfill — student-reported hours recorded while the student could not sign in.',
  'Admin backfill. Source: student-reported via text to Elizabeth, 2026-11-23. Student-reported 09:00–15:20 (America/Indiana/Indianapolis). Left at 3:20 PM.',
  '<ADMIN_USER_ID>', now()
where not exists (
  select 1 from progress_entries
  where apprentice_id = '<REESE_APPRENTICE_ID>'
    and program_id = '<REESE_PROGRAM_ID>'
    and work_date = '2026-11-23'
);

-- Logan — program_id from his apprentice row (to-be-confirmed).
insert into progress_entries
  (apprentice_id, partner_id, program_id, status, work_date, week_ending,
   hours_worked, clock_in_at, clock_out_at, tasks_completed, notes,
   verified_by, verified_at)
select '<LOGAN_APPRENTICE_ID>', NULL /* partner id from section 2 when known */, '<LOGAN_PROGRAM_ID>',
  'verified', '2026-11-20', '2026-11-21', 9.00,
  '2026-11-20T09:00:00-05:00'::timestamptz, '2026-11-20T18:00:00-05:00'::timestamptz,
  'Admin backfill — student-reported hours recorded while the student could not sign in.',
  'Admin backfill. Source: student-reported via text to Elizabeth, 2026-11-23. Student-reported 09:00–18:00 (America/Indiana/Indianapolis).',
  '<ADMIN_USER_ID>', now()
where not exists (
  select 1 from progress_entries
  where apprentice_id = '<LOGAN_APPRENTICE_ID>'
    and program_id = '<LOGAN_PROGRAM_ID>'
    and work_date = '2026-11-20'
);

insert into progress_entries
  (apprentice_id, partner_id, program_id, status, work_date, week_ending,
   hours_worked, clock_in_at, clock_out_at, tasks_completed, notes,
   verified_by, verified_at)
select '<LOGAN_APPRENTICE_ID>', NULL /* partner id from section 2 when known */, '<LOGAN_PROGRAM_ID>',
  'verified', '2026-11-23', '2026-11-28', 9.00,
  '2026-11-23T09:00:00-05:00'::timestamptz, '2026-11-23T18:00:00-05:00'::timestamptz,
  'Admin backfill — student-reported hours recorded while the student could not sign in.',
  'Admin backfill. Source: student-reported via text to Elizabeth, 2026-11-23. Student-reported 09:00–18:00 (America/Indiana/Indianapolis). Reported as 9–6 although the screenshot was taken at 3:04 PM; recorded as reported.',
  '<ADMIN_USER_ID>', now()
where not exists (
  select 1 from progress_entries
  where apprentice_id = '<LOGAN_APPRENTICE_ID>'
    and program_id = '<LOGAN_PROGRAM_ID>'
    and work_date = '2026-11-23'
);

-- ── 4) Verify ──────────────────────────────────────────────────────────
select apprentice_id, work_date, week_ending, hours_worked, status
from progress_entries
where apprentice_id in ('<REESE_APPRENTICE_ID>', '<LOGAN_APPRENTICE_ID>')
  and work_date between '2026-11-19' and '2026-11-23'
order by apprentice_id, work_date;
-- Expect 5 rows: Reese 7.67 + 8.50 + 6.33 = 22.50h; Logan 9.00 + 9.00 = 18.00h.
