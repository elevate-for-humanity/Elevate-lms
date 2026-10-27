-- Allow each authenticated learner to own one resume while preserving staff/admin access.
alter table public.resumes enable row level security;

create unique index if not exists resumes_user_id_uidx
  on public.resumes(user_id)
  where user_id is not null;

drop policy if exists resumes_select_own on public.resumes;
create policy resumes_select_own
  on public.resumes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists resumes_insert_own on public.resumes;
create policy resumes_insert_own
  on public.resumes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists resumes_update_own on public.resumes;
create policy resumes_update_own
  on public.resumes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists resumes_delete_own on public.resumes;
create policy resumes_delete_own
  on public.resumes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.resumes to authenticated;
revoke all on public.resumes from anon;
