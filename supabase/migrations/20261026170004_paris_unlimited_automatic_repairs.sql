-- Owner explicitly authorized unlimited automatic repairs on 2026-10-26.
-- Infinity keeps older serving runtimes compatible during rollout: their
-- count >= max_daily_repairs comparison remains false for every finite count.
-- New runtimes do not consult this legacy quota column.
begin;
alter table public.paris_autopilot_policy drop constraint if exists paris_autopilot_policy_max_daily_repairs_check;
alter table public.paris_autopilot_policy alter column max_daily_repairs type double precision using max_daily_repairs::double precision;
alter table public.paris_autopilot_policy alter column max_daily_repairs set default 'Infinity'::double precision;
alter table public.paris_autopilot_policy add constraint paris_autopilot_policy_max_daily_repairs_check check (max_daily_repairs > 0 and max_daily_repairs <> 'NaN'::double precision);
update public.paris_autopilot_policy set max_daily_repairs='Infinity'::double precision where id=true;
comment on column public.paris_autopilot_policy.max_daily_repairs is 'Legacy rollout compatibility only. Infinity means no daily quota; scheduler no longer consults this column.';
commit;
