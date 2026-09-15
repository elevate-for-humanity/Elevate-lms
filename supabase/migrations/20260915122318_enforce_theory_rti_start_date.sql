alter table public.apprenticeship_theory_schedules
  alter column starts_on set default date '2026-09-21';

update public.apprenticeship_theory_schedules
set starts_on = date '2026-09-21',
    updated_at = now()
where active is true
  and starts_on is null;
