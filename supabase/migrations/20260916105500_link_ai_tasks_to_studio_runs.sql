alter table public.ai_tasks
  add column if not exists studio_run_id uuid references public.studio_runs(id) on delete set null,
  add column if not exists studio_run_step_id uuid references public.studio_run_steps(id) on delete set null;

create index if not exists ai_tasks_studio_run_id_idx
  on public.ai_tasks(studio_run_id, created_at);
create index if not exists ai_tasks_studio_run_step_id_idx
  on public.ai_tasks(studio_run_step_id, created_at)
  where studio_run_step_id is not null;

comment on column public.ai_tasks.studio_run_id is
  'Canonical Studio run that owns this task.';
comment on column public.ai_tasks.studio_run_step_id is
  'Canonical Studio run step that dispatched this task.';
