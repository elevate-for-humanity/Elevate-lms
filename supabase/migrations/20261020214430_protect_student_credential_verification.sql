alter table public.student_credential_uploads enable row level security;
drop policy if exists scu_student_own on public.student_credential_uploads;
drop policy if exists scu_student_read_own on public.student_credential_uploads;
create policy scu_student_read_own on public.student_credential_uploads
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.student_credential_uploads from anon;
