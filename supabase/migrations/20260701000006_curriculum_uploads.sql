-- curriculum_uploads: stores metadata for files uploaded via /admin/curriculum/upload
-- Files are stored in the 'curriculum' Supabase Storage bucket.

create table if not exists public.curriculum_uploads (
  id          uuid        primary key default gen_random_uuid(),
  title       text,
  category    text        not null default 'curriculum',
  file_name   text        not null,
  file_path   text        not null,
  file_type   text,
  file_size   bigint,
  public_url  text,
  status      text        not null default 'uploaded',
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists curriculum_uploads_created_at_idx
  on public.curriculum_uploads (created_at desc);

create index if not exists curriculum_uploads_category_idx
  on public.curriculum_uploads (category);

alter table public.curriculum_uploads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'curriculum_uploads'
      and policyname = 'Admins can manage curriculum uploads'
  ) then
    create policy "Admins can manage curriculum uploads"
      on public.curriculum_uploads
      for all
      using (true)
      with check (true);
  end if;
end $$;

-- Storage bucket (idempotent — safe to run even if bucket already exists)
insert into storage.buckets (id, name, public)
values ('curriculum', 'curriculum', true)
on conflict (id) do nothing;

-- Storage policies: authenticated upload/delete, public read
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated users can upload curriculum'
  ) then
    create policy "Authenticated users can upload curriculum"
      on storage.objects for insert to authenticated
      with check (bucket_id = 'curriculum');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated users can delete curriculum'
  ) then
    create policy "Authenticated users can delete curriculum"
      on storage.objects for delete to authenticated
      using (bucket_id = 'curriculum');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public can read curriculum'
  ) then
    create policy "Public can read curriculum"
      on storage.objects for select to public
      using (bucket_id = 'curriculum');
  end if;
end $$;
