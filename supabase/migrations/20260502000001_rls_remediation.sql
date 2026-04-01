-- RLS Remediation — Phase 1
-- Enables RLS on tables that had policies defined but RLS not enabled,
-- and locks down efh_migrations from all client access.
--
-- Run in Supabase Dashboard → SQL Editor.
-- Safe to re-run (all statements are idempotent).

-- ============================================================
-- 1. ENABLE RLS on tables with no row-level security
-- ============================================================

-- course_lessons: queried by LMS lesson page — gate to enrolled users
alter table public.course_lessons enable row level security;

-- library_resources: course-scoped resources — gate to authenticated
alter table public.library_resources enable row level security;

-- program_tracks: program metadata — safe for public read (no PII)
alter table public.program_tracks enable row level security;

-- videos: media assets — safe for public read of published rows
alter table public.videos enable row level security;

-- program_media: program images/media — safe for public read
alter table public.program_media enable row level security;

-- program_ctas: call-to-action config — safe for public read
alter table public.program_ctas enable row level security;

-- program_modules: program structure — safe for public read
alter table public.program_modules enable row level security;

-- program_lessons: lesson metadata — safe for public read
alter table public.program_lessons enable row level security;

-- efh_migrations: internal migration log — NO client access
alter table public.efh_migrations enable row level security;

-- ============================================================
-- 2. POLICIES — public content tables (anon + authenticated read)
-- ============================================================

-- program_tracks: all rows are public program metadata
drop policy if exists "public_read" on public.program_tracks;
create policy "public_read"
  on public.program_tracks for select
  to anon, authenticated
  using (true);

-- program_media: all rows are public program assets
drop policy if exists "public_read" on public.program_media;
create policy "public_read"
  on public.program_media for select
  to anon, authenticated
  using (true);

-- program_ctas: all rows are public CTA config
drop policy if exists "public_read" on public.program_ctas;
create policy "public_read"
  on public.program_ctas for select
  to anon, authenticated
  using (true);

-- program_modules: all rows are public program structure
drop policy if exists "public_read" on public.program_modules;
create policy "public_read"
  on public.program_modules for select
  to anon, authenticated
  using (true);

-- program_lessons: all rows are public lesson metadata
drop policy if exists "public_read" on public.program_lessons;
create policy "public_read"
  on public.program_lessons for select
  to anon, authenticated
  using (true);

-- videos: only published rows visible to public
drop policy if exists "public_read_published" on public.videos;
create policy "public_read_published"
  on public.videos for select
  to anon, authenticated
  using (
    published = true
    or (select auth.role()) = 'service_role'
  );

-- ============================================================
-- 3. POLICIES — authenticated-only tables
-- ============================================================

-- course_lessons: authenticated users can read (enrollment gating
-- is enforced at the API layer, not RLS — keeps queries simple)
drop policy if exists "authenticated_read" on public.course_lessons;
create policy "authenticated_read"
  on public.course_lessons for select
  to authenticated
  using (true);

-- library_resources: authenticated users can read
drop policy if exists "authenticated_read" on public.library_resources;
create policy "authenticated_read"
  on public.library_resources for select
  to authenticated
  using (true);

-- ============================================================
-- 4. efh_migrations — LOCK DOWN completely
-- No client (anon or authenticated) should ever read this table.
-- Service role bypasses RLS so admin scripts still work.
-- ============================================================

-- Revoke all client grants
revoke all on table public.efh_migrations from anon;
revoke all on table public.efh_migrations from authenticated;

-- No policies = no access for any client role (RLS is now enabled above)
-- Service role bypasses RLS by default — no policy needed for it.

-- ============================================================
-- 5. Admin write policies for content tables
-- Only service_role (admin client) can insert/update/delete.
-- No explicit policy needed — service_role bypasses RLS.
-- This comment documents the intent.
-- ============================================================

-- Verify: after running, check with:
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public'
-- and tablename in (
--   'course_lessons','library_resources','program_tracks','videos',
--   'program_media','program_ctas','program_modules','program_lessons','efh_migrations'
-- )
-- order by tablename;
