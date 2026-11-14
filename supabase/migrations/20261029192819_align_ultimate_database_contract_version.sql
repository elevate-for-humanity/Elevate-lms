-- Align the two strict database gates with ULTIMATE_LESSON_CONTRACT_VERSION.
-- Replace only the exact version literal; retain fencing, evidence, publication
-- checks, approved course exceptions, ownership and existing execution grants.
DO $migration$
DECLARE
  signature text;
  target regprocedure;
  definition text;
  old_literal constant text := quote_literal('ultimate-lesson-2026-10-05.1');
  current_literal constant text := quote_literal('ultimate-lesson-2026-10-29.1');
  occurrences integer;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.complete_ultimate_lesson_autopilot(uuid,text,bigint)',
    'public.commit_ultimate_publication_core(jsonb,jsonb,uuid,uuid,jsonb)'
  ] LOOP
    target := to_regprocedure(signature);
    IF target IS NULL THEN
      RAISE EXCEPTION 'ULTIMATE_CONTRACT_GATE_MISSING:%', signature;
    END IF;
    definition := pg_get_functiondef(target);
    occurrences := (length(definition) - length(replace(definition,old_literal,''))) / length(old_literal);
    IF occurrences = 0 AND position(current_literal IN definition) > 0 THEN CONTINUE; END IF;
    IF occurrences <> 1 OR position(current_literal IN definition) > 0 THEN
      RAISE EXCEPTION 'ULTIMATE_CONTRACT_GATE_REVISION_UNEXPECTED:%', signature;
    END IF;
    EXECUTE replace(definition,old_literal,current_literal);
  END LOOP;
END
$migration$;
