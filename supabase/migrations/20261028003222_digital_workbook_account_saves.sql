-- Digital workbooks are program resources, separate from graded LMS assessments.
-- Saving a response never awards attendance, hours, a signature or course credit.
CREATE TABLE public.digital_workbooks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE,
 title text NOT NULL,
 program_id uuid NOT NULL REFERENCES public.programs(id),
 cover_image text NOT NULL,
 source_library_id text NOT NULL,
 is_active boolean NOT NULL DEFAULT true
);
CREATE INDEX digital_workbooks_program_idx ON public.digital_workbooks(program_id);
CREATE TABLE public.digital_workbook_sections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workbook_id uuid NOT NULL REFERENCES public.digital_workbooks(id),
 section_number integer NOT NULL CHECK(section_number>0),
 title text NOT NULL,
 unit text NOT NULL,
 pdf_page integer NOT NULL,
 prompts jsonb NOT NULL CHECK(jsonb_typeof(prompts)='array' AND jsonb_array_length(prompts)=3),
 lesson_id uuid REFERENCES public.course_lessons(id),
 UNIQUE(workbook_id,section_number)
);
CREATE INDEX digital_workbook_sections_lesson_idx ON public.digital_workbook_sections(lesson_id);
CREATE TABLE public.digital_workbook_responses (
 user_id uuid NOT NULL REFERENCES auth.users(id),
 section_id uuid NOT NULL REFERENCES public.digital_workbook_sections(id),
 answers jsonb NOT NULL DEFAULT '{}',
 reviewed boolean NOT NULL DEFAULT false,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,section_id),
 CHECK(jsonb_typeof(answers)='object' AND octet_length(answers::text)<=60000
   AND answers - ARRAY['notes','practice1','practice2','practice3','nextGoal'] = '{}'::jsonb
   AND jsonb_path_query_array(answers,'$.* ? (@.type() != "string")')='[]'::jsonb)
);
CREATE INDEX digital_workbook_responses_section_idx ON public.digital_workbook_responses(section_id);

CREATE FUNCTION rpc_private.workbook_program_access(p_program uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.program_enrollments e
  WHERE coalesce(e.user_id,e.student_id)=(SELECT auth.uid()) AND e.program_id=p_program
  AND e.revoked_at IS NULL AND e.status IN ('active','enrolled','in_progress','confirmed','completed'))
$$;
CREATE FUNCTION rpc_private.workbook_admin_read() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT security_private.privileged_session_mfa_satisfied() AND EXISTS(
  SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role IN ('admin','super_admin'))
$$;
REVOKE ALL ON FUNCTION rpc_private.workbook_program_access(uuid),rpc_private.workbook_admin_read() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.workbook_program_access(uuid),rpc_private.workbook_admin_read() TO authenticated,service_role;
ALTER TABLE public.digital_workbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_workbook_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_workbook_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.digital_workbooks,public.digital_workbook_sections,public.digital_workbook_responses FROM anon,authenticated;
GRANT SELECT ON public.digital_workbooks,public.digital_workbook_sections TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.digital_workbook_responses TO authenticated;
GRANT ALL ON public.digital_workbooks,public.digital_workbook_sections,public.digital_workbook_responses TO service_role;
CREATE POLICY workbook_assigned_read ON public.digital_workbooks FOR SELECT TO authenticated
 USING(is_active AND (rpc_private.workbook_program_access(program_id) OR (SELECT rpc_private.workbook_admin_read())));
CREATE POLICY workbook_section_assigned_read ON public.digital_workbook_sections FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.digital_workbooks w WHERE w.id=workbook_id)
 AND ((SELECT rpc_private.workbook_admin_read()) OR lesson_id IS NULL OR EXISTS(
  SELECT 1 FROM public.course_lessons l WHERE l.id=lesson_id AND l.is_published
  AND rpc_private.paced_lesson_access((SELECT auth.uid()),l.id))));
CREATE POLICY workbook_response_owner_read ON public.digital_workbook_responses FOR SELECT TO authenticated
 USING(user_id=(SELECT auth.uid()));
CREATE POLICY workbook_response_owner_insert ON public.digital_workbook_responses FOR INSERT TO authenticated
 WITH CHECK(user_id=(SELECT auth.uid()) AND EXISTS(
  SELECT 1 FROM public.digital_workbook_sections s JOIN public.digital_workbooks w ON w.id=s.workbook_id
  WHERE s.id=section_id AND rpc_private.workbook_program_access(w.program_id)));
CREATE POLICY workbook_response_owner_update ON public.digital_workbook_responses FOR UPDATE TO authenticated
 USING(user_id=(SELECT auth.uid()))
 WITH CHECK(user_id=(SELECT auth.uid()) AND EXISTS(
  SELECT 1 FROM public.digital_workbook_sections s JOIN public.digital_workbooks w ON w.id=s.workbook_id
  WHERE s.id=section_id AND rpc_private.workbook_program_access(w.program_id)));

-- Optimistic locking prevents a second device/tab overwriting newer answers.
CREATE FUNCTION public.save_digital_workbook_section(
 p_section_id uuid,p_answers jsonb,p_reviewed boolean,p_expected_version integer
) RETURNS SETOF public.digital_workbook_responses
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE='42501'; END IF;
 IF p_expected_version<0 OR p_expected_version IS NULL THEN RAISE EXCEPTION 'INVALID_VERSION' USING ERRCODE='22023'; END IF;
 IF p_expected_version=0 THEN
  RETURN QUERY INSERT INTO public.digital_workbook_responses(user_id,section_id,answers,reviewed)
   VALUES(auth.uid(),p_section_id,p_answers,p_reviewed)
   ON CONFLICT(user_id,section_id) DO NOTHING RETURNING *;
 ELSE
  RETURN QUERY UPDATE public.digital_workbook_responses SET answers=p_answers,reviewed=p_reviewed,
   version=version+1,updated_at=now()
   WHERE user_id=auth.uid() AND section_id=p_section_id AND version=p_expected_version RETURNING *;
 END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'WORKBOOK_VERSION_CONFLICT' USING ERRCODE='40001'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.save_digital_workbook_section(uuid,jsonb,boolean,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_digital_workbook_section(uuid,jsonb,boolean,integer) TO authenticated;

-- Workbook content is imported privately through the authenticated admin data
-- workflow. Keep paid manuscript content out of this public source repository.
