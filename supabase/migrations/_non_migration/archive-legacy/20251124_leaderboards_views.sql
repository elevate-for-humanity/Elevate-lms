-- ============================================
-- LEADERBOARDS (COURSE & GLOBAL)
-- Pack 8: Final Polish Features
-- ============================================

-- View: per-course leaderboard based on lesson_progress
create or replace view public.course_leaderboard as
select
  m.course_id,
  lp.user_id,
  count(*) filter (where lp.completed)::numeric
    / nullif(count(*), 0)::numeric * 100 as progress_percent,
  count(*) as lessons_total,
  count(*) filter (where lp.completed) as lessons_done
from lesson_progress lp
join lessons l on l.id = lp.lesson_id
join modules m on m.id = l.module_id
group by m.course_id, lp.user_id;

comment on view public.course_leaderboard is 'Per-course leaderboard showing student progress percentages';

-- Global leaderboard: average progress across all courses
create or replace view public.global_leaderboard as
select
  user_id,
  round(avg(progress_percent), 1) as avg_progress
from course_leaderboard
group by user_id;

comment on view public.global_leaderboard is 'Global leaderboard showing average progress across all courses';
