-- Repair the learner-path contract used by both Admin and LMS.
-- Existing catalog paths remain available; learner enrollment is idempotent.

alter table public.learning_paths
  add column if not exists is_active boolean not null default false,
  add column if not exists skills jsonb not null default '[]'::jsonb;

update public.learning_paths
set is_active = true
where path_type = 'career_track' and is_active = false;

alter table public.learning_paths
  drop constraint if exists learning_paths_path_type_check;
alter table public.learning_paths
  add constraint learning_paths_path_type_check
  check (path_type in ('credential', 'career', 'skill', 'general', 'career_track', 'skill_based', 'custom'));

alter table public.user_learning_paths
  alter column user_id set not null,
  alter column learning_path_id set not null;

alter table public.user_learning_paths
  drop constraint if exists user_learning_paths_learning_path_id_fkey;
alter table public.user_learning_paths
  add constraint user_learning_paths_learning_path_id_fkey
  foreign key (learning_path_id) references public.learning_paths(id) on delete cascade;

create unique index if not exists user_learning_paths_user_path_uidx
  on public.user_learning_paths(user_id, learning_path_id);

drop policy if exists public_read on public.learning_paths;
drop policy if exists auth_read_learning_paths on public.learning_paths;
create policy learning_paths_active_read
  on public.learning_paths
  for select to anon, authenticated
  using (is_active = true or (select public.is_staff()));

