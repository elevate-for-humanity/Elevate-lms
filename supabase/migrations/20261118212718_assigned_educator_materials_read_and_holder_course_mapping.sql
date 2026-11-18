
-- Preserve explicit credentials for canonical authored courses; legacy delivery rows still win when resolved.
CREATE OR REPLACE FUNCTION public.sync_phc_credential_id()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'pg_catalog','public','extensions' AS $$
DECLARE resolved uuid;
BEGIN
 SELECT credential_id INTO resolved FROM public.training_courses WHERE id=NEW.course_id;
 NEW.credential_id:=coalesce(resolved,NEW.credential_id);
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.sync_phc_program_id()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'pg_catalog','public','extensions' AS $$
DECLARE resolved uuid;
BEGIN
 SELECT program_id INTO resolved FROM public.courses WHERE id=NEW.course_id;
 IF resolved IS NULL THEN SELECT program_id INTO resolved FROM public.training_courses WHERE id=NEW.course_id; END IF;
 NEW.program_id:=coalesce(resolved,NEW.program_id);
 RETURN NEW;
END $$;

-- An active persisted teaching assignment is read access, never learner credit.
CREATE OR REPLACE FUNCTION rpc_private.assigned_educator_course_read(p_course uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO '' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
 SELECT 1 FROM public.instructor_assignments a JOIN public.profiles p ON p.id=a.instructor_id
 WHERE a.instructor_id=(SELECT auth.uid()) AND a.course_id=p_course AND a.active
 AND p.role IN ('instructor','program_holder') AND p.is_active IS TRUE AND NOT coalesce(p.suspended,false))
$$;
REVOKE ALL ON FUNCTION rpc_private.assigned_educator_course_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.assigned_educator_course_read(uuid) TO authenticated,service_role;

-- Internal lookup avoids recursive lesson RLS. Always scoped to the current authenticated educator.
CREATE OR REPLACE FUNCTION rpc_private.assigned_educator_lesson_read(p_lesson uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
 SELECT 1 FROM public.course_lessons l
 JOIN public.courses c ON c.id=l.course_id
 JOIN public.instructor_assignments a ON a.course_id=c.id
 JOIN public.profiles p ON p.id=a.instructor_id
 WHERE l.id=p_lesson AND l.is_published AND l.status='published'
 AND c.is_active AND c.status='published'
 AND a.instructor_id=(SELECT auth.uid()) AND a.active
 AND p.role IN ('instructor','program_holder') AND p.is_active IS TRUE AND NOT coalesce(p.suspended,false))
$$;
REVOKE ALL ON FUNCTION rpc_private.assigned_educator_lesson_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.assigned_educator_lesson_read(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION rpc_private.workbook_program_access(p_program uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO '' AS $$
 SELECT EXISTS(SELECT 1 FROM public.program_enrollments e
 WHERE coalesce(e.user_id,e.student_id)=(SELECT auth.uid()) AND e.program_id=p_program
 AND e.revoked_at IS NULL AND e.status IN ('active','enrolled','in_progress','confirmed','completed'))
 OR EXISTS(SELECT 1 FROM public.instructor_assignments a JOIN public.courses c ON c.id=a.course_id
 WHERE a.instructor_id=(SELECT auth.uid()) AND a.active AND c.program_id=p_program
 AND c.is_active AND c.status='published' AND rpc_private.assigned_educator_course_read(c.id))
$$;

ALTER POLICY holder_lesson_enrollment_required ON public.course_lessons USING (
 rpc_private.assigned_educator_lesson_read(id)
 OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role='program_holder')
 OR EXISTS(SELECT 1 FROM public.course_enrollments e WHERE e.student_id=(SELECT auth.uid())
 AND e.course_id=course_lessons.course_id AND e.status IN ('active','enrolled','in_progress','completed'))
);
ALTER POLICY paced_lesson_select ON public.course_lessons USING (
 rpc_private.assigned_educator_lesson_read(id) OR rpc_private.paced_lesson_access((SELECT auth.uid()),id)
);
CREATE OR REPLACE FUNCTION public.can_access_lesson(p_user_id uuid,p_lesson_id uuid)
RETURNS boolean LANGUAGE sql SET search_path TO 'pg_catalog','public','rpc_private' AS $$
 SELECT (p_user_id=(SELECT auth.uid()) AND rpc_private.assigned_educator_lesson_read(p_lesson_id))
 OR (rpc_private.can_access_lesson($1,$2) AND rpc_private.paced_lesson_access($1,$2))
$$;
