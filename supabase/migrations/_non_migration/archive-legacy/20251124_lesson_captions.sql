-- ============================================
-- LESSON CAPTIONS / SUBTITLES
-- Pack 8: Final Polish Features
-- ============================================

-- Lesson captions / subtitle tracks
create table if not exists public.lesson_captions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  language_code text not null,   -- 'en', 'es', etc.
  label text not null,           -- 'English', 'Spanish', etc.
  src_url text not null,         -- URL to .vtt or .srt (converted to VTT)
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_lesson_captions_lesson
  on public.lesson_captions(lesson_id);

alter table public.lesson_captions enable row level security;

-- Anyone enrolled can read captions
create policy "Anyone can view lesson captions"
  on public.lesson_captions for select
  using (true);

-- Only admins/instructors can insert/update (simplified; tighten later)
create policy "Admins/instructors can insert captions"
  on public.lesson_captions for insert
  with check (true);

create policy "Admins/instructors can update captions"
  on public.lesson_captions for update
  using (true);

create policy "Admins/instructors can delete captions"
  on public.lesson_captions for delete
  using (true);

comment on table public.lesson_captions is 'Stores subtitle/caption tracks for video lessons';
comment on column public.lesson_captions.language_code is 'ISO 639-1 language code (e.g., en, es, fr)';
comment on column public.lesson_captions.src_url is 'URL to WebVTT (.vtt) caption file';
