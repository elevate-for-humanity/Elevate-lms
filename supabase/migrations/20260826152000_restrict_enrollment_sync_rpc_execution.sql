-- Enrollment synchronization is administrative automation. API users must not
-- be able to invoke either SECURITY DEFINER implementation directly.
revoke execute on function public.sync_active_program_enrollment_courses() from public, anon, authenticated;
revoke execute on function public.sync_published_course_program_enrollments() from public, anon, authenticated;
grant execute on function public.sync_active_program_enrollment_courses() to service_role;
grant execute on function public.sync_published_course_program_enrollments() to service_role;
