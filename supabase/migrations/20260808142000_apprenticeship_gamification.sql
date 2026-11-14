-- Apprenticeship recognition based only on approved OJT hours.

INSERT INTO public.badge_definitions (key,name,description,badge_type,criteria,points_reward,rarity,is_active)
VALUES
  ('apprenticeship_100_hours','100 OJT Hours','Reached 100 approved on-the-job training hours.','completion','{"type":"approved_ojt_hours","hours":100}'::jsonb,25,'common',true),
  ('apprenticeship_500_hours','500 OJT Hours','Reached 500 approved on-the-job training hours.','completion','{"type":"approved_ojt_hours","hours":500}'::jsonb,75,'rare',true),
  ('apprenticeship_1000_hours','1,000 OJT Hours','Reached 1,000 approved on-the-job training hours.','completion','{"type":"approved_ojt_hours","hours":1000}'::jsonb,150,'rare',true),
  ('apprenticeship_1500_hours','1,500 OJT Hours','Reached 1,500 approved on-the-job training hours.','completion','{"type":"approved_ojt_hours","hours":1500}'::jsonb,250,'epic',true),
  ('apprenticeship_2000_hours','2,000 OJT Hours','Reached 2,000 approved on-the-job training hours.','completion','{"type":"approved_ojt_hours","hours":2000}'::jsonb,500,'legendary',true),
  ('apprenticeship_complete','Apprenticeship Complete','Completed the registered apprenticeship pathway.','mastery','{"type":"apprenticeship_complete"}'::jsonb,750,'legendary',true)
ON CONFLICT (key) DO UPDATE SET
  name=EXCLUDED.name,
  description=EXCLUDED.description,
  badge_type=EXCLUDED.badge_type,
  criteria=EXCLUDED.criteria,
  points_reward=EXCLUDED.points_reward,
  rarity=EXCLUDED.rarity,
  is_active=true;

CREATE OR REPLACE FUNCTION public.evaluate_apprentice_hour_milestones(p_apprentice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  uid uuid;
  approved_hours numeric := 0;
  threshold integer;
  reward integer;
  badge_key text;
BEGIN
  SELECT user_id INTO uid FROM public.apprentices WHERE id=p_apprentice_id;
  IF uid IS NULL THEN RETURN; END IF;

  SELECT COALESCE(sum(hours_worked),0) INTO approved_hours
  FROM public.apprentice_hours
  WHERE apprentice_id=p_apprentice_id AND status='approved';

  FOR threshold,reward,badge_key IN
    SELECT * FROM (VALUES
      (100,25,'apprenticeship_100_hours'::text),
      (500,75,'apprenticeship_500_hours'::text),
      (1000,150,'apprenticeship_1000_hours'::text),
      (1500,250,'apprenticeship_1500_hours'::text),
      (2000,500,'apprenticeship_2000_hours'::text)
    ) AS v(hours,reward_points,key)
  LOOP
    IF approved_hours >= threshold THEN
      PERFORM public.award_gamification_points(
        uid,
        'apprenticeship_milestone',
        'apprentice:'||p_apprentice_id::text||':'||threshold::text||'h',
        NULL,
        reward,
        jsonb_build_object('apprentice_id',p_apprentice_id,'approved_hours',approved_hours,'threshold',threshold)
      );
      PERFORM public.award_badge_by_key(uid,badge_key);
    END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.evaluate_apprentice_hour_milestones(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.evaluate_apprentice_hour_milestones(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.evaluate_apprentice_hour_milestones(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_apprentice_hour_milestones(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.gamify_apprentice_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
BEGIN
  IF NEW.apprentice_id IS NOT NULL AND NEW.status='approved' THEN
    PERFORM public.evaluate_apprentice_hour_milestones(NEW.apprentice_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS gamify_apprentice_hours_trigger ON public.apprentice_hours;
CREATE TRIGGER gamify_apprentice_hours_trigger
AFTER INSERT OR UPDATE OF status,hours_worked ON public.apprentice_hours
FOR EACH ROW EXECUTE FUNCTION public.gamify_apprentice_hours();

CREATE OR REPLACE FUNCTION public.gamify_apprentice_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL
     AND lower(COALESCE(NEW.status,'')) IN ('completed','complete','graduated')
     AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.award_gamification_points(
      NEW.user_id,'apprenticeship_completed','apprentice_complete:'||NEW.id::text,NULL,750,
      jsonb_build_object('apprentice_id',NEW.id,'program_id',NEW.program_id)
    );
    PERFORM public.award_badge_by_key(NEW.user_id,'apprenticeship_complete');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS gamify_apprentice_completion_trigger ON public.apprentices;
CREATE TRIGGER gamify_apprentice_completion_trigger
AFTER INSERT OR UPDATE OF status ON public.apprentices
FOR EACH ROW EXECUTE FUNCTION public.gamify_apprentice_completion();
