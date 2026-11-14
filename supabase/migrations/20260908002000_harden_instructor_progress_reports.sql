create index if not exists instructor_progress_reports_program_idx
  on public.instructor_progress_reports(program_id);

drop policy if exists instructor_progress_reports_read_own
  on public.instructor_progress_reports;
create policy instructor_progress_reports_read_own
  on public.instructor_progress_reports for select to authenticated
  using (
    instructor_id = (select auth.uid())
    or student_id = (select auth.uid())
  );

alter function public.prevent_instructor_progress_report_mutation()
  set search_path = '';
