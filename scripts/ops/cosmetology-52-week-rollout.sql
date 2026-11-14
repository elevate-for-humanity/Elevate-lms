-- Applied on 2026-10-28 under owner authorization. This is a one-time cohort rollout.
-- Preserves all preexisting enrolled learners before changing the default for new intake.
BEGIN;
SET LOCAL statement_timeout='8s';
LOCK TABLE public.course_pacing_plans,public.course_lesson_release_weeks IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE prior_release ON COMMIT DROP AS SELECT * FROM public.course_lesson_release_weeks WHERE course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
INSERT INTO public.course_learner_release_weeks(user_id,course_id,lesson_id,release_week,total_weeks,reason)
SELECT u.user_id,w.course_id,w.lesson_id,w.release_week,p.total_weeks,'Preserved existing learner schedule before new 52-week intake plan; hours-based acceleration awaits reconciled requirement'
FROM (SELECT student_id user_id FROM public.course_enrollments WHERE course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec' AND revoked_at IS NULL
UNION SELECT coalesce(user_id,student_id) FROM public.program_enrollments WHERE course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec' AND revoked_at IS NULL)u
JOIN public.course_lesson_release_weeks w ON w.course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec'
JOIN public.course_pacing_plans p ON p.course_id=w.course_id
WHERE u.user_id IS NOT NULL ON CONFLICT DO NOTHING;
WITH numbered AS(SELECT id,row_number()over(order by order_index,id) n,count(*)over() total FROM public.course_lessons WHERE course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec')
UPDATE public.course_lesson_release_weeks w SET release_week=1+floor((n.n-1)*51.0/(n.total-1))::integer FROM numbered n WHERE w.lesson_id=n.id AND w.course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
UPDATE public.course_pacing_plans SET total_weeks=52 WHERE course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
UPDATE public.courses SET duration_weeks=52,metadata=jsonb_set(metadata,'{pacingWeeks}','52'::jsonb),updated_at=now() WHERE id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
DO $$ BEGIN
IF (SELECT count(*) FROM public.course_lesson_release_weeks WHERE course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec')<>40 THEN RAISE EXCEPTION '40 schedule rows required'; END IF;
IF EXISTS(SELECT 1 FROM public.course_learner_release_weeks o JOIN prior_release w ON w.lesson_id=o.lesson_id AND w.course_id=o.course_id WHERE o.release_week<>w.release_week OR o.total_weeks<>50) THEN RAISE EXCEPTION 'Existing learner schedule changed';END IF;
IF (SELECT max(release_week) FROM public.course_lesson_release_weeks WHERE course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec')<>52 THEN RAISE EXCEPTION '52-week range missing';END IF;
END $$;
COMMIT;
