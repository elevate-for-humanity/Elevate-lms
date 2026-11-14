alter table public.paris_code_repairs add column if not exists attempt_count integer not null default 0 check (attempt_count between 0 and 2);
alter table public.paris_code_repairs add column if not exists attempt_history jsonb not null default '[]'::jsonb;
