-- Keep the purchased plan, add-ons, and compatibility license in one transaction.
UPDATE public.subscription_plans
SET limits = jsonb_set(COALESCE(limits, '{}'::jsonb), '{contacts}', 'null'::jsonb)
WHERE slug = 'business';

CREATE OR REPLACE FUNCTION public.grant_tenant_course_builder_credits(p_tenant_id uuid, p_app_slug text, p_credits integer, p_operation text, p_idempotency_key text, p_period_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_period_end timestamp with time zone DEFAULT NULL::timestamp with time zone, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(applied boolean, balance integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_balance integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  if p_credits <= 0 or nullif(trim(p_idempotency_key), '') is null then raise exception 'positive credits and idempotency key required'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key, 0));

  select l.balance_after into v_balance
  from public.tenant_course_builder_credit_ledger l
  where l.idempotency_key = p_idempotency_key;
  if found then return query select false, v_balance; return; end if;

  insert into public.tenant_course_builder_credit_wallets(tenant_id, app_slug)
  values (p_tenant_id, p_app_slug)
  on conflict (tenant_id, app_slug) do nothing;

  update public.tenant_course_builder_credit_wallets
  set balance = tenant_course_builder_credit_wallets.balance + p_credits,
      lifetime_granted = lifetime_granted + p_credits,
      current_period_start = coalesce(p_period_start, current_period_start),
      current_period_end = coalesce(p_period_end, current_period_end),
      updated_at = now()
  where tenant_id = p_tenant_id and app_slug = p_app_slug
  returning tenant_course_builder_credit_wallets.balance into v_balance;

  insert into public.tenant_course_builder_credit_ledger(
    tenant_id, app_slug, operation, entry_type, credits_delta,
    balance_after, idempotency_key, source, metadata
  ) values (
    p_tenant_id, p_app_slug, p_operation, 'grant', p_credits,
    v_balance, p_idempotency_key, coalesce(p_metadata->>'billing_provider', 'subscription'), p_metadata
  );
  return query select true, v_balance;
end;
$function$;


CREATE OR REPLACE FUNCTION public.refund_tenant_course_builder_credits(p_tenant_id uuid, p_user_id uuid, p_app_slug text, p_operation text, p_credits integer, p_idempotency_key text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(applied boolean, balance integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_balance integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  if p_credits <= 0 or nullif(trim(p_idempotency_key), '') is null then raise exception 'positive credits and idempotency key required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key, 0));
  select l.balance_after into v_balance from public.tenant_course_builder_credit_ledger l where l.idempotency_key = p_idempotency_key;
  if found then return query select false, v_balance; return; end if;

  update public.tenant_course_builder_credit_wallets
  set balance = tenant_course_builder_credit_wallets.balance + p_credits,
      lifetime_used = greatest(0, lifetime_used - p_credits),
      updated_at = now()
  where tenant_id = p_tenant_id and app_slug = p_app_slug
  returning tenant_course_builder_credit_wallets.balance into v_balance;
  if v_balance is null then raise exception 'course builder credit wallet not found'; end if;

  insert into public.tenant_course_builder_credit_ledger(
    tenant_id, user_id, app_slug, operation, entry_type, credits_delta,
    balance_after, idempotency_key, source, metadata
  ) values (
    p_tenant_id, p_user_id, p_app_slug, p_operation, 'refund', p_credits,
    v_balance, p_idempotency_key, 'course_builder', p_metadata
  );
  return query select true, v_balance;
end;
$function$;


CREATE TABLE IF NOT EXISTS public.platform_subscription_deliveries (
  delivery_key text PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_subscription_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_subscription_deliveries FROM anon, authenticated;
GRANT SELECT, INSERT ON public.platform_subscription_deliveries TO service_role;

CREATE OR REPLACE FUNCTION public.refresh_course_builder_subscription_credits(p_tenant_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET timezone = 'UTC' AS $$
DECLARE
  v_start timestamptz;
  v_end timestamptz;
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_month integer := 0;
  v_provider text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  SELECT s.current_period_start, s.current_period_end, s.billing_provider INTO v_start, v_end, v_provider
    FROM public.organization_subscriptions s JOIN public.organizations o ON o.id = s.organization_id
    WHERE o.tenant_id = p_tenant_id AND s.status = 'active'
      AND s.current_period_end > now()
      AND EXISTS (SELECT 1 FROM public.addon_subscriptions a WHERE a.organization_id = p_tenant_id
        AND a.addon_code = 'course-creation-learning-platform' AND a.active);
  IF v_start IS NULL OR v_end IS NULL OR v_start > now() THEN RETURN; END IF;
  LOOP
    v_month_start := v_start + v_month * interval '1 month';
    EXIT WHEN v_month_start > now() OR v_month_start >= v_end;
    v_month_end := LEAST(v_start + (v_month + 1) * interval '1 month', v_end);
    PERFORM public.grant_tenant_course_builder_credits(p_tenant_id, 'course-creation-learning-platform',
      2500, 'subscription_monthly_allowance',
      'course-builder-allowance:' || p_tenant_id::text || ':' || v_month_start::text,
      v_month_start, v_month_end, jsonb_build_object('billing_authority', 'organization_subscriptions', 'billing_provider', v_provider));
    v_month := v_month + 1;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_course_builder_subscription_credits(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_course_builder_subscription_credits(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_platform_subscription(
  p_tenant_id uuid,
  p_organization_id uuid,
  p_plan_slug text,
  p_interval text,
  p_provider text,
  p_subscription_id text,
  p_customer_id text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_addon_codes text[],
  p_license_tier text,
  p_customer_email text DEFAULT NULL,
  p_status text DEFAULT 'active',
  p_cancel_at_period_end boolean DEFAULT false,
  p_delivery_key text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_plan public.subscription_plans%ROWTYPE;
  v_codes text[];
  v_features text[];
  v_limits jsonb;
  v_email text;
  v_has_access boolean;
  v_now timestamptz := now();
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_tenant_id::text, 0));
  -- Serialize retries and simultaneous plan changes for this tenant.
  PERFORM 1 FROM public.organizations
    WHERE id = p_organization_id AND tenant_id = p_tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Billing organization does not belong to this workspace'; END IF;
  IF p_delivery_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.platform_subscription_deliveries WHERE delivery_key = p_delivery_key) THEN
      IF NOT EXISTS (SELECT 1 FROM public.platform_subscription_deliveries
        WHERE delivery_key = p_delivery_key AND tenant_id = p_tenant_id AND organization_id = p_organization_id) THEN
        RAISE EXCEPTION 'Delivery key belongs to another workspace';
      END IF;
      RETURN false;
    END IF;
    INSERT INTO public.platform_subscription_deliveries(delivery_key, tenant_id, organization_id)
      VALUES (p_delivery_key, p_tenant_id, p_organization_id);
  END IF;
  IF p_interval NOT IN ('month', 'year') OR p_interval IS NULL THEN
    RAISE EXCEPTION 'Invalid subscription interval';
  END IF;
  IF p_provider NOT IN ('quickbooks', 'stripe') OR p_provider IS NULL THEN
    RAISE EXCEPTION 'Unsupported billing provider';
  END IF;
  IF p_status NOT IN ('active', 'trialing', 'past_due', 'unpaid', 'canceled') OR p_status IS NULL THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;
  IF p_status IN ('active', 'trialing') AND (p_period_end IS NULL OR p_period_start IS NULL) THEN
    RAISE EXCEPTION 'Subscription period end and start are required';
  END IF;
  IF p_status IN ('active', 'trialing') AND NULLIF(trim(p_subscription_id), '') IS NULL THEN
    RAISE EXCEPTION 'Provider subscription identity is required';
  END IF;
  IF p_period_start IS NOT NULL AND p_period_end <= p_period_start THEN
    RAISE EXCEPTION 'Subscription period end must follow its start';
  END IF;
  v_has_access := p_status IN ('active', 'trialing') AND p_period_end > v_now;
  v_has_access := COALESCE(v_has_access, false);
  SELECT * INTO STRICT v_plan FROM public.subscription_plans
    WHERE slug = p_plan_slug AND (active OR NOT v_has_access);
  IF p_license_tier IS DISTINCT FROM (v_plan.slug || CASE WHEN p_interval = 'year' THEN '_annual' ELSE '_monthly' END) THEN
    RAISE EXCEPTION 'License tier must match the purchased plan';
  END IF;
  SELECT COALESCE(array_agg(DISTINCT code ORDER BY code), '{}'::text[])
    INTO v_codes FROM unnest(CASE WHEN v_has_access THEN COALESCE(p_addon_codes, '{}'::text[]) ELSE '{}'::text[] END) AS code;
  IF EXISTS (SELECT 1 FROM unnest(v_codes) AS requested(code)
    WHERE NOT EXISTS (SELECT 1 FROM public.saas_addon_catalog c WHERE c.code = requested.code AND c.active)) THEN
    RAISE EXCEPTION 'Purchased add-on is unavailable';
  END IF;

  SELECT array_agg(DISTINCT CASE f.code WHEN 'bookings' THEN 'booking'
    WHEN 'automation' THEN 'automations' WHEN 'ai' THEN 'ai_advanced' ELSE f.code END)
    INTO v_features FROM public.plan_features pf JOIN public.features f ON f.id = pf.feature_id
    WHERE pf.plan_id = v_plan.id;
  IF v_has_access AND COALESCE(cardinality(v_features), 0) = 0 THEN
    RAISE EXCEPTION 'Plan has no configured capabilities';
  END IF;
  SELECT array_agg(DISTINCT feature ORDER BY feature) INTO v_features FROM (
    SELECT unnest(v_features) AS feature
    UNION ALL
    SELECT unnest(c.feature_codes) FROM public.saas_addon_catalog c WHERE c.code = ANY(v_codes)
  ) capabilities;
  IF NOT v_has_access THEN v_features := '{}'::text[]; END IF;
  v_limits := COALESCE(v_plan.limits, '{}'::jsonb);
  IF 'additional-user' = ANY(v_codes) THEN
    v_limits := jsonb_set(v_limits, '{users}', to_jsonb(COALESCE((v_limits->>'users')::int, 0) + 1));
  END IF;
  IF 'additional-location' = ANY(v_codes) THEN
    v_limits := jsonb_set(v_limits, '{locations}', to_jsonb(COALESCE((v_limits->>'locations')::int, 0) + 1));
  END IF;
  IF 'additional-storage' = ANY(v_codes) THEN
    v_limits := jsonb_set(v_limits, '{storageGb}', to_jsonb(COALESCE((v_limits->>'storageGb')::int, 0) + 100));
  END IF;

  IF NOT v_has_access THEN v_limits := '{"users":0}'::jsonb; END IF;

  INSERT INTO public.organization_subscriptions (
    organization_id, plan_id, plan_type, billing_interval, status, billing_provider,
    provider_subscription_id, provider_customer_id, current_period_start, current_period_end,
    cancel_at_period_end, canceled_at, metadata, updated_at
  ) VALUES (p_organization_id, v_plan.id, v_plan.slug, p_interval, p_status, p_provider,
    p_subscription_id, p_customer_id, p_period_start, p_period_end, p_cancel_at_period_end, CASE WHEN p_status = 'canceled' THEN v_now ELSE NULL END,
    jsonb_build_object('tenant_id', p_tenant_id, 'plan_slug', p_plan_slug, 'addon_slugs', v_codes), v_now)
  ON CONFLICT (organization_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id, plan_type = EXCLUDED.plan_type,
    billing_interval = EXCLUDED.billing_interval, status = EXCLUDED.status,
    billing_provider = EXCLUDED.billing_provider, provider_subscription_id = EXCLUDED.provider_subscription_id,
    provider_customer_id = EXCLUDED.provider_customer_id, current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end, cancel_at_period_end = EXCLUDED.cancel_at_period_end, canceled_at = EXCLUDED.canceled_at,
    metadata = EXCLUDED.metadata, updated_at = EXCLUDED.updated_at;

  UPDATE public.addon_subscriptions SET active = false, canceled_at = v_now, updated_at = v_now
    WHERE organization_id = p_tenant_id;
  UPDATE public.organization_addons SET status = 'inactive', canceled_at = v_now, updated_at = v_now
    WHERE tenant_id = p_tenant_id;
  INSERT INTO public.addon_subscriptions (organization_id, addon_code, monthly_price, active, canceled_at, updated_at)
    SELECT p_tenant_id, c.code, c.monthly_price, true, NULL, v_now
    FROM public.saas_addon_catalog c WHERE c.code = ANY(v_codes)
    ON CONFLICT (organization_id, addon_code) DO UPDATE SET
      monthly_price = EXCLUDED.monthly_price, active = true, canceled_at = NULL, updated_at = v_now;
  INSERT INTO public.organization_addons (tenant_id, addon_slug, status, canceled_at, updated_at)
    SELECT p_tenant_id, code, 'active', NULL, v_now FROM unnest(v_codes) AS code
    ON CONFLICT (tenant_id, addon_slug) DO UPDATE SET status = 'active', canceled_at = NULL, updated_at = v_now;

  UPDATE public.licenses SET organization_id = p_organization_id, tier = p_license_tier, status = CASE WHEN v_has_access THEN 'active' ELSE 'suspended' END, features = v_features,
    max_users = COALESCE((v_limits->>'users')::int, 1), billing_provider = p_provider,
    provider_subscription_id = p_subscription_id, provider_customer_id = p_customer_id,
    current_period_end = p_period_end, expires_at = p_period_end, ends_at = p_period_end,
    suspended_at = CASE WHEN v_has_access THEN NULL ELSE v_now END,
    canceled_at = CASE WHEN p_status = 'canceled' THEN v_now ELSE NULL END,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('saas_plan_slug', p_plan_slug,
      'limits', v_limits, 'addon_codes', v_codes, 'subscription_authority', 'organization_subscriptions', 'billing_access', v_has_access),
    updated_at = v_now WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    v_email := NULLIF(trim(p_customer_email), '');
    IF v_email IS NULL THEN
      SELECT contact_email INTO v_email FROM public.organizations WHERE id = p_organization_id;
    END IF;
    IF v_email IS NULL THEN
      SELECT email INTO v_email FROM public.profiles WHERE tenant_id = p_tenant_id AND email IS NOT NULL AND role IN ('org_admin', 'admin', 'super_admin')
        ORDER BY CASE WHEN role IN ('org_admin', 'admin') THEN 0 ELSE 1 END, id LIMIT 1;
    END IF;
    IF v_email IS NULL THEN RAISE EXCEPTION 'Workspace billing email is required'; END IF;
    INSERT INTO public.licenses (tenant_id, organization_id, license_key, customer_email, tier, status, features,
      max_users, billing_provider, provider_subscription_id, provider_customer_id, current_period_end, expires_at, ends_at, metadata)
    VALUES (p_tenant_id, p_organization_id, 'saas-' || p_tenant_id::text, v_email, p_license_tier, CASE WHEN v_has_access THEN 'active' ELSE 'suspended' END, v_features,
      COALESCE((v_limits->>'users')::int, 1), p_provider, p_subscription_id, p_customer_id, p_period_end, p_period_end, p_period_end,
      jsonb_build_object('saas_plan_slug', p_plan_slug, 'limits', v_limits, 'addon_codes', v_codes,
        'subscription_authority', 'organization_subscriptions', 'billing_access', v_has_access));
  END IF;
  PERFORM public.refresh_course_builder_subscription_credits(p_tenant_id);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_platform_subscription(uuid,uuid,text,text,text,text,text,timestamptz,timestamptz,text[],text,text,text,boolean,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_platform_subscription(uuid,uuid,text,text,text,text,text,timestamptz,timestamptz,text[],text,text,text,boolean,text) TO service_role;
