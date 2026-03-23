BEGIN;

-- 1) Ensure every course_module belongs to a course
ALTER TABLE public.course_modules
  ALTER COLUMN course_id SET NOT NULL;

-- 2) Ensure every course_lesson belongs to a module
ALTER TABLE public.course_lessons
  ALTER COLUMN module_id SET NOT NULL;

-- 3) Prevent duplicate module order inside a course
CREATE UNIQUE INDEX IF NOT EXISTS course_modules_course_id_order_idx
  ON public.course_modules(course_id, order_index);

-- 4) Prevent duplicate lesson order inside a module
CREATE UNIQUE INDEX IF NOT EXISTS course_lessons_module_id_order_idx
  ON public.course_lessons(module_id, order_index);

-- 5) Prevent duplicate completion rule rows per module
CREATE UNIQUE INDEX IF NOT EXISTS module_completion_rules_module_id_idx
  ON public.module_completion_rules(module_id);

-- 6) Read performance indexes
CREATE INDEX IF NOT EXISTS course_modules_course_id_idx
  ON public.course_modules(course_id);

CREATE INDEX IF NOT EXISTS course_lessons_module_id_idx
  ON public.course_lessons(module_id);

-- 7) Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
