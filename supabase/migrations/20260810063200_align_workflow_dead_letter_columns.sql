alter table public.workflow_dead_letters rename column last_error to error;
alter table public.workflow_dead_letters rename column payload to trigger_payload;
