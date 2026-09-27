alter table public.ultimate_course_builds drop constraint ultimate_course_builds_status_check;
alter table public.ultimate_course_builds add constraint ultimate_course_builds_status_check check (status in ('initializing','queued','running','built','built_with_findings','blocked','failed','published','archived'));
