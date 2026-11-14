-- Retire the abandoned PARIS-specific admissions storage created by
-- 20260723000001_paris_zora_workflow.sql.
--
-- Canonical authorities:
--   applications          = admissions application/status
--   program_enrollments   = program enrollment
--   course_enrollments    = LMS course access
--   digital_binders       = post-enrollment binder authority
--   follow_up_reminders   = admissions staff follow-up work
--   agentic_build_*       = PARIS interview conversation/build state before submission
--
-- Production never received the paris_* tables, but fresh/replayed databases may
-- create them from the historical migration. Drop them here so every environment
-- converges on the same authority model. No canonical application data is moved
-- because these tables were never a production authority.

begin;

drop table if exists public.paris_application_enrollments cascade;
drop table if exists public.paris_application_decisions cascade;
drop table if exists public.paris_application_notes cascade;
drop table if exists public.paris_workflow_events cascade;
drop table if exists public.paris_workflow_tasks cascade;
drop table if exists public.paris_funding_cases cascade;
drop table if exists public.paris_application_documents cascade;
drop table if exists public.paris_applications cascade;

drop function if exists public.generate_paris_application_number();

-- Leave historical enum types in place if they exist. They are inert after the
-- tables above are removed, and retaining them avoids cascading into any unknown
-- migration-time dependency outside the retired PARIS schema.

commit;
