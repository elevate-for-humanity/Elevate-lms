-- Keep workforce participant writes transactionally coupled to their audit event.
-- Deployments that already ran the function's creation migration need a forward update.
DO $migration$
DECLARE
  definition text;
  updated_definition text;
BEGIN
  SELECT pg_get_functiondef(
    'public.audited_mutation(text,text,jsonb,jsonb,text[],text,uuid,text,text,jsonb,inet,text)'::regprocedure
  ) INTO definition;

  IF position('workforce_participants' IN definition) > 0 THEN
    RETURN;
  END IF;

  updated_definition := replace(
    definition,
    '''notifications''',
    '''notifications'', ''workforce_participants'''
  );

  IF updated_definition = definition THEN
    RAISE EXCEPTION 'Could not extend audited_mutation table allowlist';
  END IF;

  EXECUTE updated_definition;
END
$migration$;
