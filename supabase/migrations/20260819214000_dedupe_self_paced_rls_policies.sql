BEGIN;
DROP POLICY IF EXISTS "Users can update own flashcard progress" ON public.flashcard_progress;
DROP POLICY IF EXISTS focused_reviews_all_admin ON public.focused_reviews;
DROP POLICY IF EXISTS focused_reviews_user_insert ON public.focused_reviews;
DROP POLICY IF EXISTS focused_reviews_user_select ON public.focused_reviews;
DROP POLICY IF EXISTS focused_reviews_user_update ON public.focused_reviews;
DROP POLICY IF EXISTS course_module_settings_all_admin ON public.course_module_settings;
DROP POLICY IF EXISTS course_module_settings_select ON public.course_module_settings;
COMMIT;
