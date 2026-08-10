alter table public.user_app_subscriptions
  add constraint user_app_subscriptions_user_app_key unique (user_id, app_slug);

alter table public.organization_subscriptions
  add constraint organization_subscriptions_organization_key unique (organization_id);
