-- Workbooks are course companions, available outside timed video sessions.
-- Enrollment/purchase RLS, private answers, publication and completion gates remain.
CREATE OR REPLACE FUNCTION rpc_private.workbook_lesson_published(p_lesson uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.course_lessons l JOIN public.courses c ON c.id=l.course_id
  WHERE l.id=p_lesson AND l.is_published AND l.status='published' AND c.is_active
 );
$$;
REVOKE ALL ON FUNCTION rpc_private.workbook_lesson_published(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_private.workbook_lesson_published(uuid) TO authenticated, service_role;
ALTER POLICY workbook_section_assigned_read ON public.digital_workbook_sections
USING (
 EXISTS (SELECT 1 FROM public.digital_workbooks w WHERE w.id=digital_workbook_sections.workbook_id)
 AND (
  (SELECT rpc_private.workbook_admin_read())
  OR rpc_private.workbook_purchase_access(workbook_id)
  OR lesson_id IS NULL
  OR rpc_private.workbook_lesson_published(lesson_id)
 )
);
COMMENT ON FUNCTION rpc_private.workbook_lesson_published(uuid) IS
'Workbook-only publication check. Does not authorize video playback, award time or complete lessons.';
