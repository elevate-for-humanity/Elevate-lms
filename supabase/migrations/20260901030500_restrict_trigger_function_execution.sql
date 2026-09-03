-- Trigger functions execute through their owning triggers and must not be
-- callable as public Data API RPCs.
revoke all on function public.enqueue_program_enrollment_welcome() from public, anon, authenticated;
revoke all on function public.sync_published_cosmetology_to_apprentice_dashboard() from public, anon, authenticated;
grant execute on function public.enqueue_program_enrollment_welcome() to service_role;
grant execute on function public.sync_published_cosmetology_to_apprentice_dashboard() to service_role;
