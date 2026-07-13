-- apprentice_skills: skill definitions per program, linked to skill_categories
-- skill_categories already exists; this table was missing from the schema

create table if not exists public.apprentice_skills (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.skill_categories(id) on delete cascade,
  program_id  uuid,
  name        text not null,
  description text,
  "order"     integer default 0,
  created_at  timestamptz default now()
);

create index if not exists apprentice_skills_category_id_idx on public.apprentice_skills(category_id);
create index if not exists apprentice_skills_program_id_idx  on public.apprentice_skills(program_id);

-- RLS: admins/staff write; apprentices read their own program's skills
alter table public.apprentice_skills enable row level security;

create policy "apprentice_skills_read" on public.apprentice_skills
  for select using (true);

create policy "apprentice_skills_write" on public.apprentice_skills
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'staff')
    )
  );
