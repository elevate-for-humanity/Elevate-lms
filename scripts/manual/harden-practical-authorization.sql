-- Scoped practical evidence submission. Decisions remain in the validated server API.
DROP POLICY IF EXISTS "authorized reviewers read practical submissions" ON public.course_practical_submissions;
CREATE POLICY "authorized reviewers read practical submissions" ON public.course_practical_submissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.is_active IS DISTINCT FROM false AND p.suspended IS DISTINCT FROM true AND (p.role IN ('admin','super_admin') OR (p.role IN ('instructor','staff','org_admin') AND EXISTS (SELECT 1 FROM public.instructor_assignments a WHERE a.instructor_id=p.id AND a.active=true AND a.course_id=course_practical_submissions.course_id)))));
DROP POLICY IF EXISTS "learners create own practical submissions" ON public.course_practical_submissions;
CREATE POLICY "learners create own practical submissions" ON public.course_practical_submissions FOR INSERT TO authenticated WITH CHECK (learner_id=(SELECT auth.uid()) AND status='submitted' AND learner_attestation=true
AND cardinality(competency_keys)>0 AND jsonb_typeof(evidence)='array' AND jsonb_array_length(evidence)>0
AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.is_active IS DISTINCT FROM false AND p.suspended IS DISTINCT FROM true)
AND EXISTS (SELECT 1 FROM public.program_enrollments e WHERE COALESCE(e.user_id,e.student_id)=(SELECT auth.uid()) AND e.course_id=course_practical_submissions.course_id
  AND e.access_granted_at IS NOT NULL AND e.revoked_at IS NULL AND e.suspended_at IS NULL AND e.cancelled_at IS NULL
  AND COALESCE(e.status,e.enrollment_state) IN ('active','in_progress','enrolled','confirmed','pending_funding_verification')
  AND COALESCE(e.status,'') NOT IN ('withdrawn','revoked','rejected','suspended','cancelled')
  AND COALESCE(e.enrollment_state,'') NOT IN ('withdrawn','revoked','rejected','suspended','cancelled'))
AND EXISTS (SELECT 1 FROM public.course_lessons l JOIN public.courses c ON c.id=l.course_id WHERE l.id=lesson_id AND l.course_id=course_practical_submissions.course_id AND l.is_published=true AND l.practical_required=true AND c.is_active=true AND c.status='published')
AND public.can_access_lesson((SELECT auth.uid()),lesson_id));
DROP POLICY IF EXISTS "learners resubmit own practical submissions" ON public.course_practical_submissions;
CREATE POLICY "learners resubmit own practical submissions" ON public.course_practical_submissions FOR UPDATE TO authenticated USING (learner_id=(SELECT auth.uid()) AND status IN ('submitted','revision_required') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.is_active IS DISTINCT FROM false AND p.suspended IS DISTINCT FROM true)) WITH CHECK (learner_id=(SELECT auth.uid()) AND status='submitted' AND learner_attestation=true
AND cardinality(competency_keys)>0 AND jsonb_typeof(evidence)='array' AND jsonb_array_length(evidence)>0
AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.is_active IS DISTINCT FROM false AND p.suspended IS DISTINCT FROM true)
AND EXISTS (SELECT 1 FROM public.program_enrollments e WHERE COALESCE(e.user_id,e.student_id)=(SELECT auth.uid()) AND e.course_id=course_practical_submissions.course_id
  AND e.access_granted_at IS NOT NULL AND e.revoked_at IS NULL AND e.suspended_at IS NULL AND e.cancelled_at IS NULL
  AND COALESCE(e.status,e.enrollment_state) IN ('active','in_progress','enrolled','confirmed','pending_funding_verification')
  AND COALESCE(e.status,'') NOT IN ('withdrawn','revoked','rejected','suspended','cancelled')
  AND COALESCE(e.enrollment_state,'') NOT IN ('withdrawn','revoked','rejected','suspended','cancelled'))
AND EXISTS (SELECT 1 FROM public.course_lessons l JOIN public.courses c ON c.id=l.course_id WHERE l.id=lesson_id AND l.course_id=course_practical_submissions.course_id AND l.is_published=true AND l.practical_required=true AND c.is_active=true AND c.status='published')
AND public.can_access_lesson((SELECT auth.uid()),lesson_id));
REVOKE INSERT,UPDATE,DELETE ON public.course_practical_reviews FROM anon,authenticated;
REVOKE DELETE ON public.course_practical_submissions FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.course_practical_submissions TO authenticated;
GRANT SELECT ON public.course_practical_reviews TO authenticated;
DROP POLICY IF EXISTS "active account reads" ON public.course_practical_submissions;
CREATE POLICY "active account reads" ON public.course_practical_submissions AS RESTRICTIVE FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.is_active IS DISTINCT FROM false AND p.suspended IS DISTINCT FROM true));
DROP POLICY IF EXISTS "active account reads" ON public.course_practical_reviews;
CREATE POLICY "active account reads" ON public.course_practical_reviews AS RESTRICTIVE FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.is_active IS DISTINCT FROM false AND p.suspended IS DISTINCT FROM true));
DROP POLICY IF EXISTS "active account reads" ON public.learning_action_events;
CREATE POLICY "active account reads" ON public.learning_action_events AS RESTRICTIVE FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.is_active IS DISTINCT FROM false AND p.suspended IS DISTINCT FROM true));
DROP POLICY IF EXISTS "learners request their own practical review" ON public.learning_action_events;
CREATE POLICY "learners request their own practical review" ON public.learning_action_events FOR INSERT TO authenticated WITH CHECK (
learner_id=(SELECT auth.uid()) AND action='request_expert_review' AND source_type='practical_submission' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.is_active IS DISTINCT FROM false AND p.suspended IS DISTINCT FROM true)
AND EXISTS (SELECT 1 FROM public.course_practical_submissions s WHERE s.id=source_id AND s.learner_id=(SELECT auth.uid()) AND s.status='submitted' AND s.course_id=learning_action_events.course_id AND s.lesson_id=learning_action_events.lesson_id AND payload->'competencyKeys'=to_jsonb(s.competency_keys)));
GRANT SELECT,INSERT ON public.learning_action_events TO authenticated;
CREATE OR REPLACE FUNCTION public.preserve_practical_submission_identity() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF current_user IN ('anon','authenticated') THEN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.learner_id IS DISTINCT FROM OLD.learner_id OR NEW.course_id IS DISTINCT FROM OLD.course_id OR NEW.lesson_id IS DISTINCT FROM OLD.lesson_id OR NEW.interaction_id IS DISTINCT FROM OLD.interaction_id THEN
   RAISE EXCEPTION 'PRACTICAL_SUBMISSION_IDENTITY_IMMUTABLE';
  END IF;
  NEW.submitted_at := clock_timestamp();
  NEW.updated_at := clock_timestamp();
 END IF;
 RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.preserve_practical_submission_identity() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS preserve_practical_submission_identity ON public.course_practical_submissions;
CREATE TRIGGER preserve_practical_submission_identity BEFORE UPDATE ON public.course_practical_submissions FOR EACH ROW EXECUTE FUNCTION public.preserve_practical_submission_identity();

GRANT SELECT ON public.instructor_assignments TO authenticated;
DROP POLICY IF EXISTS "authorized reviewers create reviews" ON public.course_practical_reviews;
CREATE POLICY "authorized reviewers create reviews" ON public.course_practical_reviews FOR INSERT TO authenticated WITH CHECK (reviewer_id=(SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.course_practical_submissions s WHERE s.id=submission_id AND s.learner_id<>(SELECT auth.uid()) AND s.status IN ('submitted','in_review') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.is_active IS DISTINCT FROM false AND p.suspended IS DISTINCT FROM true AND (p.role IN ('admin','super_admin') OR (p.role IN ('instructor','staff','org_admin') AND EXISTS (SELECT 1 FROM public.instructor_assignments a WHERE a.instructor_id=p.id AND a.active=true AND a.course_id=s.course_id))))));
