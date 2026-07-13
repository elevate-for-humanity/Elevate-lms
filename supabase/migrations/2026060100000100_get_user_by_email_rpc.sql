-- Efficient email lookup RPC used by getUserByEmail() in lib/supabase-admin.ts.
-- Replaces the previous auth.admin.listUsers() full-scan pattern.
-- SECURITY DEFINER so it can read profiles regardless of caller RLS context.

create or replace function public.get_user_id_by_email(user_email text)
returns table (id uuid, email text)
language sql
security definer
stable
as $$
  select id, email
  from public.profiles
  where lower(email) = lower(trim(user_email))
  limit 1;
$$;

-- Restrict execution to authenticated roles only
revoke all on function public.get_user_id_by_email(text) from public, anon;
grant execute on function public.get_user_id_by_email(text) to authenticated, service_role;
