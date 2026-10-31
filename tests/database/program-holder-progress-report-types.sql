-- Exercise the deployed table's real CHECK constraints on an isolated temporary
-- copy. No Program Holder, learner, report, clock, or progress rows are changed.
BEGIN;
CREATE TEMP TABLE report_contract_probe
  (LIKE public.program_holder_reports INCLUDING DEFAULTS INCLUDING CONSTRAINTS)
  ON COMMIT DROP;
DO $$
DECLARE kind text; rejected boolean := false;
BEGIN
  FOREACH kind IN ARRAY ARRAY['general','weekly','monthly','compliance','financial','incident','student_progress']
  LOOP
    INSERT INTO report_contract_probe(program_holder_id,title,report_type,status)
    VALUES(gen_random_uuid(),'Temporary report contract check',kind,'submitted');
  END LOOP;
  BEGIN
    INSERT INTO report_contract_probe(program_holder_id,title,report_type,status)
    VALUES(gen_random_uuid(),'Invalid report type check','unsupported_report_type','submitted');
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Unsupported report type was accepted'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: student progress and all original report types accepted; unsupported types rejected; no persistent reports written' AS result;
