-- Runs entirely in a rolled-back transaction: no student answers are changed.
BEGIN;
CREATE TEMP TABLE workbook_test_context ON COMMIT DROP AS
SELECT coalesce(e.user_id,e.student_id) learner_id,
 (SELECT p2.id FROM public.profiles p2 WHERE p2.id<>coalesce(e.user_id,e.student_id)
  AND p2.role NOT IN ('admin','super_admin','staff','instructor')
  AND NOT EXISTS(SELECT 1 FROM public.program_enrollments e2 WHERE coalesce(e2.user_id,e2.student_id)=p2.id AND e2.program_id=w.program_id) LIMIT 1) other_id,
 w.id workbook_id,NULL::uuid section_id
FROM public.program_enrollments e JOIN public.profiles p ON p.id=coalesce(e.user_id,e.student_id)
 JOIN public.digital_workbooks w ON w.program_id=e.program_id
WHERE w.slug='prestige-elevation-barbering' AND e.status IN ('active','enrolled','in_progress','confirmed','completed')
 AND e.revoked_at IS NULL AND p.role NOT IN ('admin','super_admin','staff','instructor') LIMIT 1;
-- Use an uncommitted QA section, so this test never touches existing answers.
WITH inserted AS (
 INSERT INTO public.digital_workbook_sections(workbook_id,section_number,title,unit,pdf_page,prompts)
 SELECT c.workbook_id,(SELECT coalesce(max(s.section_number),0)+1 FROM public.digital_workbook_sections s WHERE s.workbook_id=c.workbook_id),
 'Transaction-only save test','Regression test',1,'["First test prompt","Second test prompt","Third test prompt"]'::jsonb
 FROM workbook_test_context c RETURNING id
) UPDATE workbook_test_context SET section_id=(SELECT id FROM inserted);
GRANT SELECT ON workbook_test_context TO authenticated;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM workbook_test_context WHERE learner_id IS NOT NULL AND other_id IS NOT NULL) THEN RAISE EXCEPTION 'Missing test context'; END IF; END $$;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',learner_id,'role','authenticated')::text,true) IS NOT NULL FROM workbook_test_context;
SET LOCAL ROLE authenticated;
DO $$
DECLARE s uuid; a public.digital_workbook_responses; denied boolean:=false;
BEGIN
 SELECT section_id INTO s FROM workbook_test_context;
 IF NOT EXISTS(SELECT 1 FROM public.digital_workbook_sections WHERE id=s) THEN RAISE EXCEPTION 'Enrolled workbook not visible'; END IF;
 SELECT * INTO a FROM public.save_digital_workbook_section(s,'{"notes":"Workbook regression test","practice1":"","practice2":"","practice3":"","nextGoal":""}',false,0);
 IF a.version<>1 OR a.answers->>'notes'<>'Workbook regression test' THEN RAISE EXCEPTION 'Save failed'; END IF;
 SELECT * INTO a FROM public.digital_workbook_responses WHERE section_id=s;
 IF a.answers->>'notes'<>'Workbook regression test' THEN RAISE EXCEPTION 'Reopen failed'; END IF;
 SELECT * INTO a FROM public.save_digital_workbook_section(s,'{"notes":"","practice1":"","practice2":"","practice3":"","nextGoal":""}',true,1);
 IF a.version<>2 OR a.answers->>'notes'<>'' THEN RAISE EXCEPTION 'Clearing failed'; END IF;
 BEGIN PERFORM public.save_digital_workbook_section(s,'{}',false,1);
 EXCEPTION WHEN serialization_failure THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Stale overwrite allowed'; END IF;
 BEGIN UPDATE public.digital_workbook_responses SET user_id=(SELECT other_id FROM workbook_test_context) WHERE section_id=s;
 RAISE EXCEPTION 'Owner reassignment allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true) IS NOT NULL FROM workbook_test_context;
SET LOCAL ROLE authenticated;
DO $$ DECLARE s uuid; BEGIN
 SELECT section_id INTO s FROM workbook_test_context;
 IF EXISTS(SELECT 1 FROM public.digital_workbook_responses WHERE section_id=s) THEN RAISE EXCEPTION 'Cross-user answer leak'; END IF;
 IF EXISTS(SELECT 1 FROM public.digital_workbook_sections WHERE id=s) THEN RAISE EXCEPTION 'Unassigned workbook content leak'; END IF;
 BEGIN PERFORM public.save_digital_workbook_section(s,'{}',false,0);
 RAISE EXCEPTION 'Unassigned save allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM count(*) FROM public.digital_workbooks; RAISE EXCEPTION 'Anonymous read allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: save, reopen, clearing, stale-version conflict, ownership, enrollment and anonymous isolation; all writes rolled back' AS result;
