ALTER TABLE public.user_app_subscriptions DROP CONSTRAINT IF EXISTS user_app_subscriptions_billing_provider_check;
ALTER TABLE public.user_app_subscriptions ADD CONSTRAINT user_app_subscriptions_billing_provider_check
 CHECK(billing_provider IS NULL OR billing_provider IN ('quickbooks','stripe','paypal','manual'));
ALTER TABLE public.sam_entities
  ADD COLUMN IF NOT EXISTS legal_business_name text,
  ADD COLUMN IF NOT EXISTS uei text,
  ADD COLUMN IF NOT EXISTS cage_code text,
  ADD COLUMN IF NOT EXISTS registration_expires_on date,
  ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.sam_documents
  ADD COLUMN IF NOT EXISTS uploaded_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.sam_alerts
  ADD COLUMN IF NOT EXISTS entity_id uuid REFERENCES public.sam_entities(id),
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.user_saved_grants
  ADD COLUMN IF NOT EXISTS grant_id uuid REFERENCES public.grant_opportunities(id);
CREATE UNIQUE INDEX IF NOT EXISTS user_saved_grants_owner_grant ON public.user_saved_grants(user_id,grant_id);
CREATE INDEX IF NOT EXISTS sam_entities_owner ON public.sam_entities(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS sam_alerts_entity_title ON public.sam_alerts(entity_id,user_id,title);
CREATE INDEX IF NOT EXISTS sam_alerts_owner_entity ON public.sam_alerts(user_id,entity_id);
CREATE INDEX IF NOT EXISTS sam_documents_owner_entity ON public.sam_documents(user_id,entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS grant_applications_owner_opportunity ON public.grant_applications(created_by,opportunity_id);
CREATE INDEX IF NOT EXISTS grant_applications_creator ON public.grant_applications(created_by);

-- These legacy permissive policies override every narrower ownership policy.
DROP POLICY IF EXISTS "Admin full access to grant_apps" ON public.grant_applications;
DROP POLICY IF EXISTS "Admin full access to grants" ON public.grant_opportunities;
DROP POLICY IF EXISTS public_read ON public.sam_entities;
DROP POLICY IF EXISTS auth_read_user_saved_grants ON public.user_saved_grants;
REVOKE ALL ON public.sam_entities,public.sam_documents,public.sam_alerts,public.user_saved_grants,public.grant_applications FROM anon;
GRANT SELECT,INSERT,UPDATE ON public.sam_entities,public.sam_documents,public.sam_alerts,public.user_saved_grants,public.grant_applications TO authenticated;
ALTER TABLE public.sam_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sam_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sam_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY;
-- Retain platform operator workflows without treating customer org admins as global operators.
DO $policies$
DECLARE target text; old_policy text;
BEGIN
  FOREACH target IN ARRAY ARRAY['sam_entities','sam_documents','sam_alerts','user_saved_grants','grant_applications','grant_opportunities'] LOOP
    FOREACH old_policy IN ARRAY ARRAY['admin_all','admin_bypass_select','admin_bypass_insert','admin_bypass_update','admin_bypass_delete'] LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',old_policy,target);
    END LOOP;
    EXECUTE format('CREATE POLICY individual_app_platform_operators ON public.%I FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role IN (''admin'',''super_admin'',''staff''))) WITH CHECK(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role IN (''admin'',''super_admin'',''staff'')))',target);
  END LOOP;
END;
$policies$;
CREATE POLICY sam_entities_owner_access ON public.sam_entities FOR SELECT TO authenticated
  USING(user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS users_own_sam_documents ON public.sam_documents;
CREATE POLICY sam_documents_owner_access ON public.sam_documents FOR SELECT TO authenticated
  USING(user_id=(SELECT auth.uid()) AND EXISTS(
    SELECT 1 FROM public.sam_entities e WHERE e.id=entity_id AND e.user_id=(SELECT auth.uid())));
CREATE POLICY sam_alerts_owner_access ON public.sam_alerts FOR SELECT TO authenticated
  USING(user_id=(SELECT auth.uid()) AND EXISTS(
    SELECT 1 FROM public.sam_entities e WHERE e.id=entity_id AND e.user_id=(SELECT auth.uid())));
CREATE POLICY saved_grants_owner_access ON public.user_saved_grants FOR SELECT TO authenticated
  USING(user_id=(SELECT auth.uid()));
CREATE POLICY grant_applications_owner_access ON public.grant_applications FOR SELECT TO authenticated
  USING(COALESCE(created_by,submitted_by)=(SELECT auth.uid()));

CREATE TABLE public.individual_app_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id),
  app_slug text NOT NULL,
  period_start date NOT NULL,
  searches integer NOT NULL DEFAULT 0 CHECK(searches>=0),
  PRIMARY KEY(user_id,app_slug,period_start)
);
ALTER TABLE public.individual_app_usage ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.individual_app_usage TO authenticated;
CREATE POLICY individual_app_usage_owner ON public.individual_app_usage FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
GRANT ALL ON public.individual_app_usage TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_grants_search(p_user_id uuid)
RETURNS TABLE(allowed boolean,remaining integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE v_subscription public.user_app_subscriptions%ROWTYPE; v_limit integer; v_used integer; v_month date:=date_trunc('month',now())::date;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  SELECT * INTO v_subscription FROM public.user_app_subscriptions WHERE user_id=p_user_id AND app_slug='grants' FOR UPDATE;
  IF NOT FOUND OR NOT COALESCE((v_subscription.status='active' AND v_subscription.current_period_end>now()) OR
    (v_subscription.status='trial' AND v_subscription.trial_ends_at>now()),false) THEN RAISE EXCEPTION 'Active Grants subscription required'; END IF;
  v_limit:=CASE v_subscription.plan WHEN 'starter' THEN 50 WHEN 'professional' THEN 500 WHEN 'enterprise' THEN 2000 ELSE 0 END;
  INSERT INTO public.individual_app_usage(user_id,app_slug,period_start) VALUES(p_user_id,'grants',v_month) ON CONFLICT DO NOTHING;
  UPDATE public.individual_app_usage u SET searches=u.searches+1 WHERE u.user_id=p_user_id AND u.app_slug='grants'
    AND u.period_start=v_month AND u.searches<v_limit RETURNING u.searches INTO v_used;
  IF NOT FOUND THEN RETURN QUERY SELECT false,0; ELSE RETURN QUERY SELECT true,v_limit-v_used; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_grants_search(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_grants_search(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.save_sam_entity(p_user_id uuid,p_entity_id uuid,p_values jsonb)
RETURNS public.sam_entities LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_subscription public.user_app_subscriptions%ROWTYPE; v_limit integer; v_result public.sam_entities;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  SELECT * INTO v_subscription FROM public.user_app_subscriptions WHERE user_id=p_user_id AND app_slug='sam-gov' FOR UPDATE;
  IF NOT FOUND OR NOT COALESCE((v_subscription.status='active' AND v_subscription.current_period_end>now()) OR
    (v_subscription.status='trial' AND v_subscription.trial_ends_at>now()),false) THEN RAISE EXCEPTION 'Active SAM.gov subscription required'; END IF;
  v_limit:=CASE v_subscription.plan WHEN 'starter' THEN 1 WHEN 'professional' THEN 5 WHEN 'enterprise' THEN 2147483647 ELSE 0 END;
  IF length(trim(COALESCE(p_values->>'legal_business_name','')))<2 THEN RAISE EXCEPTION 'Business name is required'; END IF;
  IF p_entity_id IS NULL THEN
    IF (SELECT count(*) FROM public.sam_entities WHERE user_id=p_user_id AND status<>'archived')>=v_limit THEN RAISE EXCEPTION 'Entity limit reached'; END IF;
    INSERT INTO public.sam_entities(user_id,legal_business_name,uei,cage_code,registration_status,registration_expires_on,notes,current_step)
      VALUES(p_user_id,trim(p_values->>'legal_business_name'),NULLIF(p_values->>'uei',''),NULLIF(p_values->>'cage_code',''),
        COALESCE(NULLIF(p_values->>'registration_status',''),'draft'),NULLIF(p_values->>'registration_expires_on','')::date,p_values->>'notes',1) RETURNING * INTO v_result;
  ELSE
    UPDATE public.sam_entities SET legal_business_name=trim(p_values->>'legal_business_name'),uei=NULLIF(p_values->>'uei',''),
      cage_code=NULLIF(p_values->>'cage_code',''),registration_status=p_values->>'registration_status',
      registration_expires_on=NULLIF(p_values->>'registration_expires_on','')::date,notes=p_values->>'notes',updated_at=now()
      WHERE id=p_entity_id AND user_id=p_user_id RETURNING * INTO v_result;
    IF NOT FOUND THEN RAISE EXCEPTION 'Entity not found'; END IF;
  END IF;
  UPDATE public.sam_alerts SET status='inactive',is_read=true WHERE entity_id=v_result.id AND user_id=p_user_id AND title='Registration renewal';
  IF v_result.registration_expires_on IS NOT NULL THEN
    INSERT INTO public.sam_alerts(entity_id,user_id,title,message,due_date,is_read)
      VALUES(v_result.id,p_user_id,'Registration renewal','Review and renew this registration on the official SAM.gov website.',v_result.registration_expires_on,false)
      ON CONFLICT(entity_id,user_id,title) DO UPDATE SET due_date=EXCLUDED.due_date,is_read=false,status='active',updated_at=now();
  END IF;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.save_sam_entity(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_sam_entity(uuid,uuid,jsonb) TO service_role;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('app-workspace-files','app-workspace-files',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
