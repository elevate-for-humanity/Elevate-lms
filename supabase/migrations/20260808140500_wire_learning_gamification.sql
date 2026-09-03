-- Wire canonical learning and engagement records into the unified gamification ledger.
-- All awards are idempotent through gamification_events source IDs.

CREATE OR REPLACE FUNCTION public.award_badge_by_key(p_user_id uuid, p_badge_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_badge uuid;
  inserted_count integer;
BEGIN
  IF p_user_id IS NULL OR p_badge_key IS NULL THEN RETURN false; END IF;
  SELECT id INTO target_badge
  FROM public.badge_definitions
  WHERE key = p_badge_key AND is_active = true
  LIMIT 1;
  IF target_badge IS NULL THEN RETURN false; END IF;

  INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
  VALUES (p_user_id, target_badge, now())
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.award_badge_by_key(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_badge_by_key(uuid,text) FROM anon;
REVOKE ALL ON FUNCTION public.award_badge_by_key(uuid,text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.award_badge_by_key(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.evaluate_gamification_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.gamification_events WHERE user_id=p_user_id AND event_type='lesson_completed';
  IF n >= 1 THEN PERFORM public.award_badge_by_key(p_user_id, 'course_starter'); END IF;
  IF n >= 10 THEN PERFORM public.award_badge_by_key(p_user_id, 'lesson_complete'); END IF;

  IF EXISTS (SELECT 1 FROM public.gamification_events WHERE user_id=p_user_id AND event_type='program_halfway') THEN
    PERFORM public.award_badge_by_key(p_user_id, 'halfway_there');
  END IF;
  IF EXISTS (SELECT 1 FROM public.gamification_events WHERE user_id=p_user_id AND event_type='course_completed') THEN
    PERFORM public.award_badge_by_key(p_user_id, 'program_graduate');
  END IF;
  IF EXISTS (SELECT 1 FROM public.gamification_events WHERE user_id=p_user_id AND event_type='certificate_earned') THEN
    PERFORM public.award_badge_by_key(p_user_id, 'certified');
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.gamification_events
    WHERE user_id=p_user_id AND event_type='quiz_completed'
      AND COALESCE((metadata->>'score')::numeric,0) >= 90
  ) THEN
    PERFORM public.award_badge_by_key(p_user_id, 'quiz_master');
  END IF;
  SELECT count(*) INTO n FROM public.gamification_events
  WHERE user_id=p_user_id AND event_type IN ('community_comment','forum_reply');
  IF n >= 5 THEN PERFORM public.award_badge_by_key(p_user_id, 'community_helper'); END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.evaluate_gamification_badges(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.evaluate_gamification_badges(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.evaluate_gamification_badges(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_gamification_badges(uuid) TO service_role;

-- Extend the point RPC so every successful award evaluates badge milestones.
CREATE OR REPLACE FUNCTION public.award_gamification_points(
  p_user_id uuid,
  p_event_type text,
  p_source_id text,
  p_course_id uuid,
  p_points integer,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer;
BEGIN
  IF p_user_id IS NULL OR p_event_type IS NULL OR p_points = 0 THEN RETURN false; END IF;
  INSERT INTO public.gamification_events (user_id,event_type,source_id,course_id,points,metadata)
  VALUES (p_user_id,p_event_type,p_source_id,p_course_id,p_points,COALESCE(p_metadata,'{}'::jsonb))
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN RETURN false; END IF;

  IF p_course_id IS NULL THEN
    INSERT INTO public.leaderboard_scores (user_id,course_id,points,updated_at)
    VALUES (p_user_id,NULL,p_points,now())
    ON CONFLICT (user_id) WHERE course_id IS NULL
    DO UPDATE SET points=public.leaderboard_scores.points+EXCLUDED.points,updated_at=now();
  ELSE
    INSERT INTO public.leaderboard_scores (user_id,course_id,points,updated_at)
    VALUES (p_user_id,p_course_id,p_points,now())
    ON CONFLICT (user_id,course_id) WHERE course_id IS NOT NULL
    DO UPDATE SET points=public.leaderboard_scores.points+EXCLUDED.points,updated_at=now();
  END IF;

  PERFORM public.evaluate_gamification_badges(p_user_id);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.award_gamification_points(uuid,text,text,uuid,integer,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_gamification_points(uuid,text,text,uuid,integer,jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.award_gamification_points(uuid,text,text,uuid,integer,jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.award_gamification_points(uuid,text,text,uuid,integer,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.gamify_student_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed IS TRUE
     AND NEW.student_id IS NOT NULL
     AND NEW.lesson_id IS NOT NULL
     AND (TG_OP='INSERT' OR COALESCE(OLD.completed,false) IS FALSE) THEN
    PERFORM public.award_gamification_points(
      NEW.student_id,'lesson_completed','lesson:'||NEW.lesson_id::text,NEW.course_id,10,
      jsonb_build_object('lesson_id',NEW.lesson_id,'progress_id',NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS gamify_student_progress_trigger ON public.student_progress;
CREATE TRIGGER gamify_student_progress_trigger
AFTER INSERT OR UPDATE OF completed ON public.student_progress
FOR EACH ROW EXECUTE FUNCTION public.gamify_student_progress();

CREATE OR REPLACE FUNCTION public.gamify_quiz_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_uuid IS NOT NULL
     AND (NEW.completed_at IS NOT NULL OR NEW.submitted_at IS NOT NULL OR NEW.status IN ('completed','submitted','graded'))
     AND (TG_OP='INSERT' OR OLD.completed_at IS DISTINCT FROM NEW.completed_at OR OLD.submitted_at IS DISTINCT FROM NEW.submitted_at OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.award_gamification_points(
      NEW.user_uuid,'quiz_completed','quiz_attempt:'||NEW.id::text,NEW.course_id,20,
      jsonb_build_object('quiz_id',NEW.quiz_id,'score',NEW.score,'passed',NEW.passed)
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS gamify_quiz_attempt_trigger ON public.quiz_attempts;
CREATE TRIGGER gamify_quiz_attempt_trigger
AFTER INSERT OR UPDATE OF completed_at,submitted_at,status ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.gamify_quiz_attempt();

CREATE OR REPLACE FUNCTION public.gamify_program_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := COALESCE(NEW.user_id, NEW.student_id);
  IF uid IS NULL THEN RETURN NEW; END IF;

  IF COALESCE(NEW.progress_percent,0) >= 50
     AND (TG_OP='INSERT' OR COALESCE(OLD.progress_percent,0) < 50) THEN
    PERFORM public.award_gamification_points(uid,'program_halfway','program_halfway:'||NEW.id::text,NEW.course_id,50,jsonb_build_object('enrollment_id',NEW.id,'program_id',NEW.program_id));
  END IF;

  IF (NEW.status='completed' OR NEW.completed_at IS NOT NULL OR NEW.completion_date IS NOT NULL)
     AND (TG_OP='INSERT' OR (OLD.status IS DISTINCT FROM NEW.status OR OLD.completed_at IS DISTINCT FROM NEW.completed_at OR OLD.completion_date IS DISTINCT FROM NEW.completion_date)) THEN
    PERFORM public.award_gamification_points(uid,'course_completed','enrollment:'||NEW.id::text,NEW.course_id,100,jsonb_build_object('enrollment_id',NEW.id,'program_id',NEW.program_id));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS gamify_program_enrollment_trigger ON public.program_enrollments;
CREATE TRIGGER gamify_program_enrollment_trigger
AFTER INSERT OR UPDATE OF status,completed_at,completion_date,progress_percent ON public.program_enrollments
FOR EACH ROW EXECUTE FUNCTION public.gamify_program_enrollment();

CREATE OR REPLACE FUNCTION public.gamify_certificate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := COALESCE(NEW.user_id, NEW.student_id);
  IF uid IS NOT NULL THEN
    PERFORM public.award_gamification_points(uid,'certificate_earned','certificate:'||NEW.id::text,NEW.course_id,200,jsonb_build_object('certificate_id',NEW.id,'program_id',NEW.program_id));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS gamify_certificate_trigger ON public.certificates;
CREATE TRIGGER gamify_certificate_trigger
AFTER INSERT ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.gamify_certificate();

CREATE OR REPLACE FUNCTION public.gamify_event_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.attended IS TRUE
     AND (TG_OP='INSERT' OR COALESCE(OLD.attended,false) IS FALSE) THEN
    PERFORM public.award_gamification_points(NEW.user_id,'event_attended','event_attended:'||COALESCE(NEW.event_id::text,NEW.id::text),NULL,25,jsonb_build_object('event_id',NEW.event_id,'registration_id',NEW.id));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS gamify_event_attendance_trigger ON public.event_registrations;
CREATE TRIGGER gamify_event_attendance_trigger
AFTER INSERT OR UPDATE OF attended ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.gamify_event_attendance();
