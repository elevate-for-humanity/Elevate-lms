-- Guard: warn when program_exam_ready_rules is inserted for a program
-- that has no program_certification_pathways row.
--
-- Without a pathway row, auto_create_exam_authorization silently skips
-- authorization creation even when a learner is fully exam ready.
-- This trigger surfaces the gap at insert time rather than at learner
-- completion time (when it's too late to notice easily).
--
-- Uses RAISE NOTICE (not EXCEPTION) — the insert still succeeds.
-- The warning appears in Supabase logs and in the seeder output.

CREATE OR REPLACE FUNCTION trg_warn_missing_certification_pathway()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.program_certification_pathways
    WHERE program_id = NEW.program_id
      AND is_primary  = true
      AND is_active   = true
  ) THEN
    RAISE NOTICE
      'program_exam_ready_rules inserted for program % but no active primary '
      'program_certification_pathways row exists. '
      'auto_create_exam_authorization will not fire until a pathway is added.',
      NEW.program_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_warn_missing_certification_pathway ON public.program_exam_ready_rules;
CREATE TRIGGER trg_warn_missing_certification_pathway
  AFTER INSERT ON public.program_exam_ready_rules
  FOR EACH ROW EXECUTE FUNCTION trg_warn_missing_certification_pathway();
