alter table public.apprenticeship_theory_schedules
  add column if not exists starts_on date;

update public.apprenticeship_theory_schedules
set starts_on = date '2026-09-21',
    updated_at = now()
where active is true;
