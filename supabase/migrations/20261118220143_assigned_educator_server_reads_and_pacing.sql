
-- Server-side lesson readers use a service client after authenticating the actor.
-- Only that trusted role or the current user can check a user's teaching assignment.
CREATE OR REPLACE FUNCTION rpc_private.assigned_educator_lesson_for_user_read(p_user uuid,p_lesson uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
 SELECT (auth.role()='service_role' OR auth.uid()=p_user) AND EXISTS(
 SELECT 1 FROM public.course_lessons l JOIN public.courses c ON c.id=l.course_id
 JOIN public.instructor_assignments a ON a.course_id=c.id JOIN public.profiles p ON p.id=a.instructor_id
 WHERE l.id=p_lesson AND l.is_published AND l.status='published' AND c.is_active AND c.status='published'
 AND a.instructor_id=p_user AND a.active AND p.role IN ('instructor','program_holder')
 AND p.is_active IS TRUE AND NOT coalesce(p.suspended,false))
$$;
REVOKE ALL ON FUNCTION rpc_private.assigned_educator_lesson_for_user_read(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.assigned_educator_lesson_for_user_read(uuid,uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.can_access_lesson(p_user_id uuid,p_lesson_id uuid)
RETURNS boolean LANGUAGE sql SET search_path TO 'pg_catalog','public','rpc_private' AS $$
 SELECT coalesce(rpc_private.assigned_educator_lesson_for_user_read($1,$2),false)
 OR (rpc_private.can_access_lesson($1,$2) AND rpc_private.paced_lesson_access($1,$2))
$$;

CREATE OR REPLACE FUNCTION public.get_my_course_pacing(p_course_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $$
DECLARE plan public.course_pacing_plans%ROWTYPE; start_at timestamptz; actor uuid:=auth.uid(); staff boolean;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT * INTO plan FROM public.course_pacing_plans WHERE course_id=p_course_id AND enabled;
 IF NOT FOUND THEN RETURN NULL; END IF;
 -- Educator reads are a separate view, not a learner schedule or attendance record.
 IF EXISTS(SELECT 1 FROM public.course_lessons l WHERE l.course_id=p_course_id
   AND rpc_private.assigned_educator_lesson_for_user_read(actor,l.id)) THEN
   RETURN jsonb_build_object('totalWeeks',plan.total_weeks,'startAt',NULL,'educatorPreview',true,
     'theoryWindow',jsonb_build_object('allowed',true,'enforced',false),'progressive',plan.release_published_lessons,
     'lessons',(SELECT coalesce(jsonb_agg(jsonb_build_object(
       'id',l.id,'module_id',l.module_id,'title',l.title,'order_index',l.order_index,'lesson_type',l.lesson_type,
       'duration_minutes',l.duration_minutes,'published',true,'releaseWeek',w.release_week,'opensAt',NULL,
       'available',true) ORDER BY l.order_index),'[]'::jsonb)
       FROM public.course_lessons l LEFT JOIN public.course_lesson_release_weeks w ON w.lesson_id=l.id AND w.course_id=l.course_id
       WHERE l.course_id=p_course_id AND rpc_private.assigned_educator_lesson_for_user_read(actor,l.id)));
 END IF;
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=actor AND p.role IN ('admin','super_admin','staff','instructor')) INTO staff;
 start_at:=rpc_private.course_pacing_start(actor,p_course_id);
 IF start_at IS NULL AND NOT staff THEN RAISE EXCEPTION 'COURSE_ENROLLMENT_REQUIRED' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('totalWeeks',coalesce((SELECT max(o.total_weeks) FROM public.course_learner_release_weeks o WHERE o.course_id=p_course_id AND o.user_id=actor),plan.total_weeks),'startAt',start_at,'theoryWindow',rpc_private.theory_access_status(actor,p_course_id,now()),'progressive',plan.release_published_lessons,
  'lessons',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'id',l.id,'module_id',l.module_id,'title',l.title,'order_index',l.order_index,'lesson_type',l.lesson_type,
   'duration_minutes',l.duration_minutes,'published',l.is_published,'releaseWeek',coalesce(o.release_week,w.release_week),
   'opensAt',start_at+make_interval(days=>7*(coalesce(o.release_week,w.release_week)-1)),
   'available',rpc_private.paced_lesson_access(actor,l.id)) ORDER BY l.order_index),'[]'::jsonb)
   FROM public.course_lessons l LEFT JOIN public.course_lesson_release_weeks w ON w.lesson_id=l.id AND w.course_id=l.course_id
   LEFT JOIN public.course_learner_release_weeks o ON o.course_id=l.course_id AND o.lesson_id=l.id AND o.user_id=actor
   WHERE l.course_id=p_course_id));
END $$;

