-- Keep generated lesson projections idempotent across retries and dashboards.
-- These constraints do not delete or rewrite existing records. Duplicate
-- preflight checks were completed before this migration was authored.

create unique index if not exists lesson_objectives_lesson_position_uidx
  on public.lesson_objectives (lesson_id, position);

create unique index if not exists assessment_questions_lesson_sort_order_uidx
  on public.assessment_questions (lesson_id, sort_order);

