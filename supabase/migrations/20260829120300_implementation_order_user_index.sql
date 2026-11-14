-- Cover the optional auth.users foreign key for account-linked orders.
create index if not exists implementation_orders_user_idx
  on public.implementation_orders (user_id)
  where user_id is not null;
