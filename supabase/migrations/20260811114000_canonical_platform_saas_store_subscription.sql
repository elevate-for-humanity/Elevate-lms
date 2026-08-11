-- Route canonical platform_saas subscriptions through the existing Stripe webhook RPC.
-- Keeps legacy store/individual-app behavior while making organization_subscriptions
-- authoritative for platform subscriptions.

alter table public.organization_subscriptions
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create or replace function public.upsert_store_subscription(
  p_user_id uuid,
  p_stripe_subscription_id text,
  p_stripe_customer_id text,
  p_stripe_price_id text,
  p_status text,
  p_cancel_at_period_end boolean,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_canceled_at timestamptz default null,
  p_ended_at timestamptz default null,
  p_trial_start timestamptz default null,
  p_trial_end timestamptz default null,
  p_metadata jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription_id uuid;
  v_product_id uuid;
  v_checkout_type text := coalesce(p_metadata ->> 'checkout_type', '');
  v_app_slug text := coalesce(p_metadata ->> 'app_slug', '');
  v_plan text := coalesce(p_metadata ->> 'plan_id', 'starter');
  v_app_status text;
  v_had_access boolean := false;
  v_has_access boolean := false;
  v_tenant_id uuid;
  v_billing_org_id uuid;
  v_plan_row_id uuid;
  v_plan_slug text;
  v_billing_interval text;
  v_org_status text;
  v_addon_slug text;
  v_addon_code text;
  v_addon_price numeric;
  v_previous_status text;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required';
  end if;

  if p_status not in (
    'incomplete', 'incomplete_expired', 'trialing', 'active',
    'past_due', 'canceled', 'unpaid', 'paused'
  ) then
    raise exception 'Unsupported store subscription status: %', p_status;
  end if;

  if v_checkout_type = 'platform_saas' then
    begin
      v_tenant_id := nullif(p_metadata ->> 'tenant_id', '')::uuid;
      v_billing_org_id := nullif(p_metadata ->> 'billing_organization_id', '')::uuid;
    exception when invalid_text_representation then
      raise exception 'Invalid platform_saas tenant/billing organization metadata';
    end;

    v_plan_slug := coalesce(nullif(p_metadata ->> 'plan_id', ''), 'professional');
    v_billing_interval := case
      when lower(coalesce(p_metadata ->> 'billing_interval', 'monthly')) in ('annual','annually','year','yearly') then 'year'
      else 'month'
    end;

    if v_tenant_id is null or v_billing_org_id is null then
      raise exception 'platform_saas requires tenant_id and billing_organization_id';
    end if;

    select id into v_plan_row_id
    from public.subscription_plans
    where slug = v_plan_slug
      and active = true
      and slug in ('solo','business','professional')
    limit 1;

    if v_plan_row_id is null then
      raise exception 'Active platform plan not found: %', v_plan_slug;
    end if;

    select status into v_previous_status
    from public.organization_subscriptions
    where organization_id = v_billing_org_id;

    v_org_status := case
      when p_status in ('active','trialing') then p_status
      when p_status in ('past_due','unpaid','incomplete') then 'past_due'
      when p_status in ('canceled','incomplete_expired') then 'canceled'
      else 'past_due'
    end;
    v_has_access := p_status in ('active','trialing');

    insert into public.organization_subscriptions (
      organization_id, stripe_subscription_id, stripe_customer_id, plan_id,
      plan_type, billing_interval, status, current_period_start,
      current_period_end, cancel_at_period_end, metadata, updated_at
    ) values (
      v_billing_org_id, p_stripe_subscription_id, p_stripe_customer_id,
      v_plan_row_id, v_plan_slug, v_billing_interval, v_org_status,
      p_current_period_start, p_current_period_end, p_cancel_at_period_end,
      jsonb_build_object(
        'tenant_id', v_tenant_id,
        'plan_slug', v_plan_slug,
        'addon_slugs', coalesce(p_metadata ->> 'addon_slugs', ''),
        'stripe_status', p_status
      ),
      now()
    )
    on conflict (organization_id)
    do update set
      stripe_subscription_id = excluded.stripe_subscription_id,
      stripe_customer_id = excluded.stripe_customer_id,
      plan_id = excluded.plan_id,
      plan_type = excluded.plan_type,
      billing_interval = excluded.billing_interval,
      status = excluded.status,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end,
      metadata = excluded.metadata,
      updated_at = now()
    returning id into v_subscription_id;

    update public.addon_subscriptions
      set active = false, canceled_at = now(), updated_at = now()
    where organization_id = v_tenant_id;

    update public.organization_addons
      set status = 'inactive', canceled_at = now(), updated_at = now()
    where tenant_id = v_tenant_id;

    if v_has_access then
      for v_addon_slug in
        select trim(value)
        from regexp_split_to_table(coalesce(p_metadata ->> 'addon_slugs', ''), ',') as value
        where trim(value) <> ''
      loop
        v_addon_code := case v_addon_slug
          when 'ai-addon' then 'ai-assistant'
          when 'online-courses-lms' then 'lms'
          when 'text-messaging' then 'sms'
          when 'credential-testing-center' then 'testing-center'
          when 'white-label-mobile' then 'white-label-mobile'
          when 'additional-storage' then 'additional-storage'
          else v_addon_slug
        end;

        select monthly_price into v_addon_price
        from public.saas_addon_catalog
        where code = v_addon_code and active = true
        limit 1;

        if found then
          insert into public.addon_subscriptions (
            organization_id, addon_code, monthly_price, active,
            activated_at, canceled_at, metadata, updated_at
          ) values (
            v_tenant_id, v_addon_code, v_addon_price, true,
            now(), null,
            jsonb_build_object('stripe_subscription_id', p_stripe_subscription_id),
            now()
          )
          on conflict (organization_id, addon_code)
          do update set
            monthly_price = excluded.monthly_price,
            active = true,
            activated_at = now(),
            canceled_at = null,
            metadata = excluded.metadata,
            updated_at = now();

          insert into public.organization_addons (
            tenant_id, addon_slug, status, activated_at, canceled_at, metadata, updated_at
          ) values (
            v_tenant_id, v_addon_code, 'active', now(), null,
            jsonb_build_object('stripe_subscription_id', p_stripe_subscription_id),
            now()
          )
          on conflict (tenant_id, addon_slug)
          do update set
            status = 'active',
            activated_at = now(),
            canceled_at = null,
            metadata = excluded.metadata,
            updated_at = now();
        end if;
      end loop;
    end if;

    perform public.enqueue_platform_event_v1(
      case
        when p_status in ('active','trialing') then 'billing.subscription_activated'
        when p_status in ('past_due','unpaid','incomplete') then 'billing.subscription_past_due'
        when p_status in ('canceled','incomplete_expired') then 'billing.subscription_canceled'
        else 'billing.subscription_updated'
      end,
      'billing', 'db.rpc.upsert_store_subscription', 'organization_subscription',
      p_stripe_subscription_id, p_user_id, v_tenant_id, p_stripe_subscription_id,
      'billing:platform:' || p_stripe_subscription_id || ':' || p_status || ':' || coalesce(p_current_period_end::text,'none'),
      jsonb_build_object(
        'billing_organization_id', v_billing_org_id,
        'tenant_id', v_tenant_id,
        'plan_slug', v_plan_slug,
        'status', v_org_status,
        'stripe_status', p_status,
        'addon_slugs', coalesce(p_metadata ->> 'addon_slugs', '')
      )
    );

    perform public.enqueue_platform_event_v1(
      case when v_has_access then 'entitlement.granted' else 'entitlement.revoked' end,
      'entitlement', 'db.rpc.upsert_store_subscription', 'tenant',
      v_tenant_id::text, p_user_id, v_tenant_id, p_stripe_subscription_id,
      'entitlement:platform:' || p_stripe_subscription_id || ':' || p_status,
      jsonb_build_object('plan_slug', v_plan_slug, 'status', v_org_status)
    );

    if v_has_access and coalesce(v_previous_status, '') not in ('active','trialing') then
      perform public.enqueue_platform_event_v1(
        'provisioning.requested', 'provisioning', 'db.rpc.upsert_store_subscription',
        'tenant', v_tenant_id::text, p_user_id, v_tenant_id,
        p_stripe_subscription_id,
        'provisioning:platform:' || p_stripe_subscription_id || ':' || v_plan_slug,
        jsonb_build_object(
          'kind', 'platform_workspace',
          'plan_slug', v_plan_slug,
          'addon_slugs', coalesce(p_metadata ->> 'addon_slugs', '')
        )
      );
    end if;

    return jsonb_build_object(
      'success', true,
      'subscription_id', v_subscription_id,
      'subscription_type', 'platform_saas',
      'tenant_id', v_tenant_id,
      'organization_id', v_billing_org_id
    );
  end if;

  if v_checkout_type = 'individual_app' then
    if v_app_slug not in ('website-builder','sam-gov','grants') then
      raise exception 'Unsupported individual app slug: %', v_app_slug;
    end if;
    if v_plan not in ('starter','professional','enterprise') then
      raise exception 'Unsupported individual app plan: %', v_plan;
    end if;

    select status in ('active','trial') into v_had_access
    from public.user_app_subscriptions
    where user_id = p_user_id and app_slug = v_app_slug;
    v_had_access := coalesce(v_had_access, false);

    v_app_status := case
      when p_status in ('active','trialing') then 'active'
      when p_status in ('past_due','unpaid','incomplete') then 'past_due'
      when p_status in ('canceled','incomplete_expired') then 'canceled'
      else 'inactive'
    end;
    v_has_access := v_app_status = 'active';

    insert into public.user_app_subscriptions (
      user_id, app_slug, plan, status, stripe_subscription_id,
      stripe_customer_id, current_period_start, current_period_end,
      trial_ends_at, updated_at
    ) values (
      p_user_id, v_app_slug, v_plan, v_app_status, p_stripe_subscription_id,
      p_stripe_customer_id, p_current_period_start, p_current_period_end,
      p_trial_end, now()
    )
    on conflict (user_id, app_slug)
    do update set
      plan = excluded.plan,
      status = excluded.status,
      stripe_subscription_id = excluded.stripe_subscription_id,
      stripe_customer_id = excluded.stripe_customer_id,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      trial_ends_at = coalesce(excluded.trial_ends_at, public.user_app_subscriptions.trial_ends_at),
      updated_at = now()
    returning id into v_subscription_id;

    perform public.enqueue_platform_event_v1(
      case
        when p_status in ('active','trialing') then 'billing.subscription_activated'
        when p_status in ('past_due','unpaid','incomplete') then 'billing.subscription_past_due'
        when p_status in ('canceled','incomplete_expired') then 'billing.subscription_canceled'
        else 'billing.subscription_updated'
      end,
      'billing', 'db.rpc.upsert_store_subscription', 'individual_app_subscription',
      p_stripe_subscription_id, p_user_id, null, p_stripe_subscription_id,
      'billing:individual-app:' || p_stripe_subscription_id || ':' || p_status || ':' || coalesce(p_current_period_end::text,'none'),
      jsonb_build_object(
        'app_slug', v_app_slug, 'plan', v_plan, 'status', v_app_status,
        'stripe_status', p_status, 'stripe_price_id', p_stripe_price_id,
        'current_period_end', p_current_period_end
      )
    );

    perform public.enqueue_platform_event_v1(
      case when v_has_access then 'entitlement.granted' else 'entitlement.revoked' end,
      'entitlement', 'db.rpc.upsert_store_subscription', 'individual_app',
      v_app_slug, p_user_id, null, p_stripe_subscription_id,
      'entitlement:individual-app:' || p_stripe_subscription_id || ':' || p_status || ':' || coalesce(p_current_period_end::text,'none'),
      jsonb_build_object('app_slug', v_app_slug, 'plan', v_plan, 'status', v_app_status)
    );

    if v_has_access and not v_had_access then
      perform public.enqueue_platform_event_v1(
        'provisioning.requested', 'provisioning', 'db.rpc.upsert_store_subscription',
        'individual_app', v_app_slug, p_user_id, null, p_stripe_subscription_id,
        'provisioning:individual-app:' || p_stripe_subscription_id,
        jsonb_build_object('kind', v_app_slug || '_workspace', 'app_slug', v_app_slug, 'plan', v_plan)
      );
    end if;

    return jsonb_build_object(
      'success', true,
      'subscription_id', v_subscription_id,
      'subscription_type', 'individual_app'
    );
  end if;

  select sp.store_product_id into v_product_id
  from public.store_prices sp
  where sp.stripe_price_id = p_stripe_price_id
    and sp.is_active = true
  limit 1;

  if v_product_id is null then
    raise exception 'Active store price not found';
  end if;

  insert into public.store_subscriptions (
    user_id, stripe_subscription_id, stripe_customer_id, stripe_price_id,
    store_product_id, status, cancel_at_period_end, current_period_start,
    current_period_end, canceled_at, ended_at, trial_start, trial_end,
    metadata, updated_at
  ) values (
    p_user_id, p_stripe_subscription_id, p_stripe_customer_id, p_stripe_price_id,
    v_product_id, p_status, p_cancel_at_period_end, p_current_period_start,
    p_current_period_end, p_canceled_at, p_ended_at, p_trial_start, p_trial_end,
    coalesce(p_metadata, '{}'::jsonb), now()
  )
  on conflict (stripe_subscription_id) where stripe_subscription_id is not null
  do update set
    user_id = excluded.user_id,
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_price_id = excluded.stripe_price_id,
    store_product_id = excluded.store_product_id,
    status = excluded.status,
    cancel_at_period_end = excluded.cancel_at_period_end,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    canceled_at = excluded.canceled_at,
    ended_at = excluded.ended_at,
    trial_start = excluded.trial_start,
    trial_end = excluded.trial_end,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into v_subscription_id;

  return jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'subscription_type', 'store'
  );
end;
$$;

revoke all on function public.upsert_store_subscription(uuid,text,text,text,text,boolean,timestamptz,timestamptz,timestamptz,timestamptz,timestamptz,timestamptz,jsonb)
  from public, anon, authenticated;
grant execute on function public.upsert_store_subscription(uuid,text,text,text,text,boolean,timestamptz,timestamptz,timestamptz,timestamptz,timestamptz,timestamptz,jsonb)
  to service_role;
