DO $patch$
DECLARE src text;
BEGIN
 SELECT pg_get_functiondef('rpc_private.sync_apprentice_theory_schedule(uuid,text,uuid,date)'::regprocedure) INTO src;
 IF position('p_slug IS NULL' IN src)=0 THEN
  IF position('p_user IS NULL OR p_slug NOT LIKE' IN src)=0 THEN
   RAISE EXCEPTION 'SCHEDULE_NULL_GUARD_PATCH_TARGET_MISSING';
  END IF;
  src:=replace(src,'p_user IS NULL OR p_slug NOT LIKE','p_user IS NULL OR p_slug IS NULL OR p_slug NOT LIKE');
  EXECUTE src;
 END IF;
END $patch$;
