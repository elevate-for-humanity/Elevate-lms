-- Include separately authored published assessments in the learner lesson count.
SET LOCAL lock_timeout='5s';
DO $migration$
DECLARE source text;
BEGIN
 source:=pg_get_functiondef('public.commit_ultimate_publication_core(jsonb,jsonb,uuid,uuid,jsonb)'::regprocedure);
 IF position('version=v_version,total_lessons=v_expected,updated_at' in source)>0 THEN
  source:=replace(source,'version=v_version,total_lessons=v_expected,updated_at','version=v_version,total_lessons=(SELECT count(*) FROM public.course_lessons counted WHERE counted.course_id=v_course_id AND counted.status=''published'' AND counted.is_published=true AND coalesce(counted.is_required,true)),updated_at');
  EXECUTE source;
 ELSIF position('counted.course_id=v_course_id' in source)=0 THEN
  RAISE EXCEPTION 'ULTIMATE_PUBLICATION_COUNT_CONTRACT_CHANGED';
 END IF;
END $migration$;
