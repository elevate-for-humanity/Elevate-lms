-- Existing own-record policies cannot work without Data API table privileges.
-- Remove the obsolete tenant-wide onboarding policies before restoring access.
-- Staff oversight and privileged MFA policies are retained.
drop policy if exists onboarding_progress_tenant_select on public.onboarding_progress;
drop policy if exists onboarding_progress_tenant_insert on public.onboarding_progress;
drop policy if exists onboarding_progress_tenant_update on public.onboarding_progress;

do $guard$
begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('digital_binders','onboarding_progress','leaderboard_scores')
      and not c.relrowsecurity
  ) then raise exception 'Learner table row security must remain enabled'; end if;
end;
$guard$;

grant select, insert, update on public.digital_binders to authenticated;
grant select, insert, update on public.onboarding_progress to authenticated;
grant select on public.leaderboard_scores to authenticated;
