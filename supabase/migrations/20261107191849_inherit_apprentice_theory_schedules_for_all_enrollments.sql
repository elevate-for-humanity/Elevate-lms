SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='20s';
CREATE OR REPLACE FUNCTION rpc_private.sync_apprentice_theory_schedule(p_user uuid,p_slug text,p_course uuid,p_start date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE target uuid; existing uuid;
BEGIN
 IF p_user IS NULL OR p_slug NOT LIKE '%apprentice%' THEN RETURN; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||p_slug,0));
 SELECT c.id INTO target FROM public.courses c LEFT JOIN public.programs p ON p.id=c.program_id
 WHERE c.is_active AND (c.id=p_course OR c.slug=p_slug OR p.slug=p_slug)
 ORDER BY (c.id=p_course) DESC NULLS LAST,(c.status='published') DESC,c.updated_at DESC LIMIT 1;
 SELECT id INTO existing FROM public.apprenticeship_theory_schedules
 WHERE user_id=p_user AND program_slug=p_slug AND active ORDER BY updated_at DESC,id LIMIT 1;
 IF existing IS NOT NULL THEN
  UPDATE public.apprenticeship_theory_schedules SET course_id=target,updated_at=now()
  WHERE id=existing AND course_id IS NULL AND target IS NOT NULL;
 ELSE
  INSERT INTO public.apprenticeship_theory_schedules(user_id,program_slug,course_id,starts_on)
  VALUES(p_user,p_slug,target,coalesce(p_start,(now() AT TIME ZONE 'America/Indiana/Indianapolis')::date));
 END IF;
END $fn$;
REVOKE ALL ON FUNCTION rpc_private.sync_apprentice_theory_schedule(uuid,text,uuid,date) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION rpc_private.inherit_enrollment_theory_schedule()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF NEW.revoked_at IS NULL AND NEW.status IN ('active','enrolled','in_progress','confirmed')
 THEN PERFORM rpc_private.sync_apprentice_theory_schedule(coalesce(NEW.user_id,NEW.student_id),NEW.program_slug,NEW.course_id,NEW.training_start_date); END IF;
 RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION rpc_private.inherit_enrollment_theory_schedule() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER inherit_enrollment_theory_schedule
AFTER INSERT OR UPDATE OF status,revoked_at,user_id,student_id,program_slug,course_id,training_start_date
ON public.program_enrollments FOR EACH ROW EXECUTE FUNCTION rpc_private.inherit_enrollment_theory_schedule();

CREATE OR REPLACE FUNCTION public.ensure_apprentice_theory_schedule()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE target uuid;
BEGIN
 IF NEW.status IS DISTINCT FROM 'active' OR NEW.program_slug IS NULL THEN RETURN NEW; END IF;
 SELECT e.course_id INTO target FROM public.program_enrollments e
 WHERE coalesce(e.user_id,e.student_id)=NEW.student_id AND e.program_slug=NEW.program_slug
 AND e.revoked_at IS NULL AND e.status IN ('active','enrolled','in_progress','confirmed')
 ORDER BY e.updated_at DESC LIMIT 1;
 PERFORM rpc_private.sync_apprentice_theory_schedule(NEW.student_id,NEW.program_slug,target,NEW.start_date);
 UPDATE public.apprenticeship_theory_schedules s SET placement_id=NEW.id,
 partner_id=(SELECT partner_id FROM public.shops WHERE id=NEW.shop_id),updated_at=now()
 WHERE s.id=(SELECT id FROM public.apprenticeship_theory_schedules WHERE user_id=NEW.student_id AND program_slug=NEW.program_slug AND active ORDER BY updated_at DESC,id LIMIT 1)
 AND (s.placement_id IS NULL OR s.placement_id=NEW.id);
 RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION public.ensure_apprentice_theory_schedule() FROM PUBLIC,anon,authenticated;
DO $backfill$
DECLARE e record;
BEGIN
 FOR e IN SELECT DISTINCT ON(coalesce(user_id,student_id),program_slug)
 coalesce(user_id,student_id) uid,program_slug,course_id,training_start_date
 FROM public.program_enrollments WHERE revoked_at IS NULL
 AND status IN ('active','enrolled','in_progress','confirmed') AND program_slug LIKE '%apprentice%'
 ORDER BY coalesce(user_id,student_id),program_slug,updated_at DESC
 LOOP PERFORM rpc_private.sync_apprentice_theory_schedule(e.uid,e.program_slug,e.course_id,e.training_start_date); END LOOP;
END $backfill$;
DO $patch$
DECLARE src text;
BEGIN
 SELECT pg_get_functiondef('rpc_private.theory_access_status(uuid,uuid,timestamptz)'::regprocedure) INTO src;
 IF position('schedule_inheritance_v1' IN src)=0 THEN
  IF position('if s.id is null then return jsonb_build_object' IN src)=0 THEN RAISE EXCEPTION 'THEORY_PATCH_TARGET_MISSING'; END IF;
  src:=replace(src,
  'if s.id is null then return jsonb_build_object(''allowed'',true,''enforced'',false,''scheduled'',false); end if;',
  '-- schedule_inheritance_v1: apprenticeship schedules are enforced independently of optional weekly release plans.
 if s.id is null then
  if exists(select 1 from public.program_enrollments e join public.courses c on c.program_id=e.program_id where coalesce(e.user_id,e.student_id)=p_user and e.program_slug like ''%apprentice%'' and e.revoked_at is null and e.status in (''active'',''enrolled'',''in_progress'',''confirmed'') and (e.course_id=p_course or c.id=p_course)) then
   return jsonb_build_object(''allowed'',false,''enforced'',true,''scheduled'',false,''reason'',''SCHEDULE_REQUIRED'');
  end if;
  return jsonb_build_object(''allowed'',true,''enforced'',false,''scheduled'',false);
 end if;
 if s.program_slug like ''%apprentice%'' then v_enforced:=true; end if;');
  EXECUTE src;
 END IF;
 SELECT pg_get_functiondef('rpc_private.paced_lesson_access(uuid,uuid)'::regprocedure) INTO src;
 IF position('schedule_inheritance_v1' IN src)=0 THEN
  IF position('IF NOT FOUND THEN RETURN true; END IF;' IN src)=0 THEN RAISE EXCEPTION 'PACING_PATCH_TARGET_MISSING'; END IF;
  src:=replace(src,'IF NOT FOUND THEN RETURN true; END IF;',
  'IF NOT FOUND THEN
   -- schedule_inheritance_v1: scheduled theory applies even without a weekly release plan.
   IF auth.role() IS DISTINCT FROM ''service_role'' AND auth.uid() IS DISTINCT FROM p_user THEN RETURN false; END IF;
   IF EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_user AND p.role IN (''admin'',''super_admin'',''staff'',''instructor'')) THEN RETURN true; END IF;
   RETURN coalesce((rpc_private.theory_access_status(p_user,l.course_id,now())->>''allowed'')::boolean,false);
  END IF;');
  EXECUTE src;
 END IF;
END $patch$;
