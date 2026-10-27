-- Opt-in pacing is separate from authoring/checkpoint profiles. Workers retain
-- service-role access and may finish/publish future lessons before learner release.
SET LOCAL lock_timeout = '5s';
CREATE TABLE public.course_pacing_plans (
 course_id uuid PRIMARY KEY REFERENCES public.courses(id) ON DELETE RESTRICT,
 total_weeks integer NOT NULL CHECK(total_weeks BETWEEN 1 AND 260),
 enabled boolean NOT NULL DEFAULT false,
 release_published_lessons boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.course_lesson_release_weeks (
 lesson_id uuid PRIMARY KEY REFERENCES public.course_lessons(id) ON DELETE RESTRICT,
 course_id uuid NOT NULL REFERENCES public.course_pacing_plans(course_id) ON DELETE RESTRICT,
 release_week integer NOT NULL CHECK(release_week BETWEEN 1 AND 260)
);
CREATE INDEX course_lesson_release_weeks_course_idx ON public.course_lesson_release_weeks(course_id);
ALTER TABLE public.course_pacing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lesson_release_weeks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.course_pacing_plans,public.course_lesson_release_weeks FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.course_pacing_plans,public.course_lesson_release_weeks TO service_role;

CREATE FUNCTION rpc_private.course_pacing_start(p_user uuid,p_course uuid)
RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(
  (SELECT CASE WHEN e.status IN ('active','enrolled','in_progress','confirmed','completed') AND e.revoked_at IS NULL
    THEN coalesce(e.training_start_date::timestamp AT TIME ZONE 'America/Indiana/Indianapolis',e.student_start_date,e.start_date,e.started_at,e.access_granted_at,e.enrolled_at,e.created_at) END
   FROM public.program_enrollments e
   WHERE (e.user_id=p_user OR e.student_id=p_user) AND e.course_id=p_course
   ORDER BY e.updated_at DESC LIMIT 1),
  (SELECT e.created_at FROM public.course_enrollments e
   WHERE e.student_id=p_user AND e.course_id=p_course
     AND e.status IN ('active','enrolled','in_progress','confirmed','completed') AND e.revoked_at IS NULL
     -- A revoked/pending canonical program enrollment cannot be bypassed by an older secondary row.
     AND NOT EXISTS(SELECT 1 FROM public.program_enrollments pe WHERE pe.course_id=p_course AND (pe.user_id=p_user OR pe.student_id=p_user))
   ORDER BY e.created_at DESC LIMIT 1)
 )
$$;
REVOKE ALL ON FUNCTION rpc_private.course_pacing_start(uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION rpc_private.pacing_requirement_met(p_start timestamptz,p_week integer,p_previous_complete boolean,p_now timestamptz)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT coalesce(p_start IS NOT NULL AND p_week>=1 AND p_previous_complete AND p_now>=p_start+make_interval(days=>7*(p_week-1)),false)
$$;
REVOKE ALL ON FUNCTION rpc_private.pacing_requirement_met(timestamptz,integer,boolean,timestamptz) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION rpc_private.paced_lesson_access(p_user uuid,p_lesson uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE l public.course_lessons%ROWTYPE; plan public.course_pacing_plans%ROWTYPE;
 week_number integer; start_at timestamptz; previous_complete boolean;
BEGIN
 SELECT * INTO l FROM public.course_lessons WHERE id=p_lesson;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT * INTO plan FROM public.course_pacing_plans WHERE course_id=l.course_id AND enabled;
 IF NOT FOUND THEN RETURN true; END IF;
 IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() IS DISTINCT FROM p_user THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_user AND p.role IN ('admin','super_admin','staff','instructor')) THEN RETURN true; END IF;
 IF NOT l.is_published OR NOT EXISTS(SELECT 1 FROM public.courses c WHERE c.id=l.course_id AND c.is_active) THEN RETURN false; END IF;
 SELECT release_week INTO week_number FROM public.course_lesson_release_weeks WHERE lesson_id=l.id AND course_id=l.course_id;
 IF week_number IS NULL OR week_number>plan.total_weeks THEN RETURN false; END IF;
 start_at:=rpc_private.course_pacing_start(p_user,l.course_id);
 SELECT NOT EXISTS(
  SELECT 1 FROM public.course_lessons previous
  WHERE previous.course_id=l.course_id AND previous.order_index<l.order_index AND previous.is_required IS DISTINCT FROM false
  AND NOT EXISTS(SELECT 1 FROM public.lesson_progress lp WHERE lp.user_id=p_user AND lp.lesson_id=previous.id AND lp.completed)
 ) INTO previous_complete;
 RETURN rpc_private.pacing_requirement_met(start_at,week_number,previous_complete,now());
END $$;
REVOKE ALL ON FUNCTION rpc_private.paced_lesson_access(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.paced_lesson_access(uuid,uuid) TO authenticated,service_role;

-- All existing module/enrollment/assessment guards remain authoritative.
CREATE OR REPLACE FUNCTION public.can_access_lesson(p_user_id uuid,p_lesson_id uuid)
RETURNS boolean LANGUAGE sql SET search_path='pg_catalog','public','rpc_private' AS $$
 SELECT rpc_private.can_access_lesson($1,$2) AND rpc_private.paced_lesson_access($1,$2)
$$;

CREATE FUNCTION rpc_private.progressive_course_visible(p_user uuid,p_course uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT (auth.role()='service_role' OR auth.uid()=p_user)
 AND EXISTS(SELECT 1 FROM public.course_pacing_plans p JOIN public.courses c ON c.id=p.course_id
   WHERE p.course_id=p_course AND p.enabled AND p.release_published_lessons AND c.is_active)
 AND rpc_private.course_pacing_start(p_user,p_course) IS NOT NULL
$$;
REVOKE ALL ON FUNCTION rpc_private.progressive_course_visible(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.progressive_course_visible(uuid,uuid) TO authenticated,service_role;
CREATE POLICY progressive_course_enrolled_read ON public.courses FOR SELECT TO authenticated
 USING(rpc_private.progressive_course_visible((SELECT auth.uid()),id));
CREATE POLICY progressive_module_enrolled_read ON public.course_modules FOR SELECT TO authenticated
 USING(is_published AND rpc_private.progressive_course_visible((SELECT auth.uid()),course_id));
CREATE POLICY progressive_lesson_enrolled_read ON public.course_lessons FOR SELECT TO authenticated
 USING(is_published AND rpc_private.progressive_course_visible((SELECT auth.uid()),course_id));
CREATE POLICY paced_lesson_select ON public.course_lessons AS RESTRICTIVE FOR SELECT TO authenticated
 USING(rpc_private.paced_lesson_access((SELECT auth.uid()),id));
CREATE POLICY paced_progress_insert ON public.lesson_progress AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(rpc_private.paced_lesson_access((SELECT auth.uid()),lesson_id));
CREATE POLICY paced_progress_update ON public.lesson_progress AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(rpc_private.paced_lesson_access((SELECT auth.uid()),lesson_id))
 WITH CHECK(rpc_private.paced_lesson_access((SELECT auth.uid()),lesson_id));
CREATE POLICY paced_checkpoint_insert ON public.checkpoint_scores AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(rpc_private.paced_lesson_access((SELECT auth.uid()),lesson_id));
CREATE POLICY paced_checkpoint_update ON public.checkpoint_scores AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(rpc_private.paced_lesson_access((SELECT auth.uid()),lesson_id))
 WITH CHECK(rpc_private.paced_lesson_access((SELECT auth.uid()),lesson_id));

-- Learners may save ordinary viewing progress. Only the existing server-scored
-- completion/assessment engine may turn that into completion or passing credit.
CREATE FUNCTION rpc_private.guard_paced_credit_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'authenticated' THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='lesson_progress' THEN
  IF NOT coalesce(NEW.completed,false) THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' THEN
   IF OLD.completed IS TRUE THEN RETURN NEW; END IF;
  END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public.course_lessons l JOIN public.course_pacing_plans p ON p.course_id=l.course_id WHERE l.id=NEW.lesson_id AND p.enabled)
 THEN RAISE EXCEPTION 'SERVER_VERIFIED_COURSE_CREDIT_REQUIRED' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION rpc_private.guard_paced_credit_write() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_paced_completion BEFORE INSERT OR UPDATE ON public.lesson_progress
 FOR EACH ROW EXECUTE FUNCTION rpc_private.guard_paced_credit_write();
CREATE TRIGGER guard_paced_assessment BEFORE INSERT OR UPDATE ON public.checkpoint_scores
 FOR EACH ROW EXECUTE FUNCTION rpc_private.guard_paced_credit_write();

-- Syllabus metadata is safe to show for locked/unbuilt lessons. No protected
-- content, assessment answers or media references leave this function.
CREATE FUNCTION public.get_my_course_pacing(p_course_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE plan public.course_pacing_plans%ROWTYPE; start_at timestamptz; actor uuid:=auth.uid(); staff boolean;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT * INTO plan FROM public.course_pacing_plans WHERE course_id=p_course_id AND enabled;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=actor AND p.role IN ('admin','super_admin','staff','instructor')) INTO staff;
 start_at:=rpc_private.course_pacing_start(actor,p_course_id);
 IF start_at IS NULL AND NOT staff THEN RAISE EXCEPTION 'COURSE_ENROLLMENT_REQUIRED' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('totalWeeks',plan.total_weeks,'startAt',start_at,'progressive',plan.release_published_lessons,
  'lessons',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'id',l.id,'module_id',l.module_id,'title',l.title,'order_index',l.order_index,'lesson_type',l.lesson_type,
   'duration_minutes',l.duration_minutes,'published',l.is_published,'releaseWeek',w.release_week,
   'opensAt',start_at+make_interval(days=>7*(w.release_week-1)),
   'available',rpc_private.paced_lesson_access(actor,l.id)) ORDER BY l.order_index),'[]'::jsonb)
   FROM public.course_lessons l LEFT JOIN public.course_lesson_release_weeks w ON w.lesson_id=l.id AND w.course_id=l.course_id
   WHERE l.course_id=p_course_id));
END $$;
REVOKE ALL ON FUNCTION public.get_my_course_pacing(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_course_pacing(uuid) TO authenticated;
