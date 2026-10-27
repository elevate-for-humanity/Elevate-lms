-- Timeclock entries represent daily shifts. The legacy weekly uniqueness
-- constraint prevented a second shift in the same week even though the table
-- already enforces duplicate-day protection with a trigger.
alter table public.progress_entries
  drop constraint if exists progress_entries_apprentice_id_partner_id_program_id_week_e_key;

create index if not exists idx_progress_entries_apprentice_open_shift
  on public.progress_entries (apprentice_id, clock_in_at desc)
  where clock_out_at is null;
