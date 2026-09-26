CREATE OR REPLACE FUNCTION public.guard_ultimate_locked_artifact_version()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE current_locked boolean;
BEGIN
  SELECT v.locked INTO current_locked
  FROM public.ultimate_artifact_versions v
  WHERE v.artifact_id=NEW.artifact_id
  ORDER BY v.version DESC LIMIT 1;
  IF coalesce(current_locked,false) THEN
    RAISE EXCEPTION 'ULTIMATE_ARTIFACT_LOCKED';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS ultimate_guard_locked_artifact_version ON public.ultimate_artifact_versions;
CREATE TRIGGER ultimate_guard_locked_artifact_version
BEFORE INSERT ON public.ultimate_artifact_versions
FOR EACH ROW EXECUTE FUNCTION public.guard_ultimate_locked_artifact_version();