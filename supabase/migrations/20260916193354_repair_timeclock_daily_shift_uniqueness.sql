-- progress_entries represents daily shifts. A legacy unique index survived the
-- earlier constraint removal and still limited each apprentice to one shift
-- per week. Replace it with an index that protects only real daily timeclock
-- shifts; draft progress rows remain reusable by the clock-in endpoint.
drop index if exists public.progress_entries_unique_week;

create unique index if not exists progress_entries_unique_daily_timeclock
  on public.progress_entries (apprentice_id, partner_id, program_id, work_date)
  where clock_in_at is not null;
