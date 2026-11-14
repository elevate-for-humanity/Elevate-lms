SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='15s';
CREATE TABLE public.course_learner_release_weeks (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 course_id uuid NOT NULL REFERENCES public.course_pacing_plans(course_id) ON DELETE RESTRICT,
 lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE RESTRICT,
 release_week integer NOT NULL CHECK(release_week BETWEEN 1 AND 260),
 total_weeks integer NOT NULL CHECK(total_weeks BETWEEN 1 AND 260 AND release_week<=total_weeks),
 reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,course_id,lesson_id)
);
ALTER TABLE public.course_learner_release_weeks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.course_learner_release_weeks FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.course_learner_release_weeks TO service_role;
COMMENT ON TABLE public.course_learner_release_weeks IS 'Service-managed learner release schedule; preserves existing pacing during cohort changes. Does not grant enrollment, completion, assessment or hour credit.';
CREATE OR REPLACE FUNCTION rpc_private.paced_lesson_access(p_user uuid, p_lesson uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE l public.course_lessons%ROWTYPE; plan public.course_pacing_plans%ROWTYPE;
 week_number integer; effective_total integer; start_at timestamptz; previous_complete boolean;
BEGIN
 SELECT * INTO l FROM public.course_lessons WHERE id=p_lesson;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT * INTO plan FROM public.course_pacing_plans WHERE course_id=l.course_id AND enabled;
 IF NOT FOUND THEN RETURN true; END IF;
 IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() IS DISTINCT FROM p_user THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_user AND p.role IN ('admin','super_admin','staff','instructor')) THEN RETURN true; END IF;
 IF NOT l.is_published OR NOT EXISTS(SELECT 1 FROM public.courses c WHERE c.id=l.course_id AND c.is_active) THEN RETURN false; END IF;
 SELECT coalesce(o.release_week,w.release_week),coalesce(o.total_weeks,plan.total_weeks)
 INTO week_number,effective_total
 FROM public.course_lesson_release_weeks w
 LEFT JOIN public.course_learner_release_weeks o
 ON o.course_id=w.course_id AND o.lesson_id=w.lesson_id AND o.user_id=p_user
 WHERE w.lesson_id=l.id AND w.course_id=l.course_id;
 IF week_number IS NULL OR week_number>effective_total THEN RETURN false; END IF;
 start_at:=rpc_private.course_pacing_start(p_user,l.course_id);
 SELECT NOT EXISTS(
  SELECT 1 FROM public.course_lessons previous
  WHERE previous.course_id=l.course_id AND previous.order_index<l.order_index AND previous.is_required IS DISTINCT FROM false
  AND NOT EXISTS(SELECT 1 FROM public.lesson_progress lp WHERE lp.user_id=p_user AND lp.lesson_id=previous.id AND lp.completed)
 ) INTO previous_complete;
 RETURN rpc_private.pacing_requirement_met(start_at,week_number,previous_complete,now());
END $function$;

CREATE OR REPLACE FUNCTION public.get_my_course_pacing(p_course_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE plan public.course_pacing_plans%ROWTYPE; start_at timestamptz; actor uuid:=auth.uid(); staff boolean;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT * INTO plan FROM public.course_pacing_plans WHERE course_id=p_course_id AND enabled;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=actor AND p.role IN ('admin','super_admin','staff','instructor')) INTO staff;
 start_at:=rpc_private.course_pacing_start(actor,p_course_id);
 IF start_at IS NULL AND NOT staff THEN RAISE EXCEPTION 'COURSE_ENROLLMENT_REQUIRED' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('totalWeeks',coalesce((SELECT max(o.total_weeks) FROM public.course_learner_release_weeks o WHERE o.course_id=p_course_id AND o.user_id=actor),plan.total_weeks),'startAt',start_at,'progressive',plan.release_published_lessons,
  'lessons',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'id',l.id,'module_id',l.module_id,'title',l.title,'order_index',l.order_index,'lesson_type',l.lesson_type,
   'duration_minutes',l.duration_minutes,'published',l.is_published,'releaseWeek',coalesce(o.release_week,w.release_week),
   'opensAt',start_at+make_interval(days=>7*(coalesce(o.release_week,w.release_week)-1)),
   'available',rpc_private.paced_lesson_access(actor,l.id)) ORDER BY l.order_index),'[]'::jsonb)
   FROM public.course_lessons l LEFT JOIN public.course_lesson_release_weeks w ON w.lesson_id=l.id AND w.course_id=l.course_id
   LEFT JOIN public.course_learner_release_weeks o ON o.course_id=l.course_id AND o.lesson_id=l.id AND o.user_id=actor
   WHERE l.course_id=p_course_id));
END $function$;

REVOKE ALL ON FUNCTION rpc_private.paced_lesson_access(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.paced_lesson_access(uuid,uuid) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_my_course_pacing(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_course_pacing(uuid) TO authenticated;
