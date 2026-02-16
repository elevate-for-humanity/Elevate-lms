-- ============================================
-- COURSE OUTCOMES & SKILLS
-- Pack 7: Professional Course Pages
-- ============================================

-- Add learning outcomes and skills to courses
alter table public.courses
  add column if not exists learning_outcomes text[],
  add column if not exists skills text[];

comment on column public.courses.learning_outcomes is 'Array of learning outcomes displayed as "What you''ll learn"';
comment on column public.courses.skills is 'Array of skills students will build';

-- Example data update (optional - can be done via admin UI)
-- update public.courses
-- set learning_outcomes = ARRAY[
--   'Build full-stack web applications',
--   'Master React and Next.js',
--   'Deploy to production'
-- ],
-- skills = ARRAY['React', 'Next.js', 'TypeScript', 'Supabase']
-- where slug = 'web-development-fundamentals';
