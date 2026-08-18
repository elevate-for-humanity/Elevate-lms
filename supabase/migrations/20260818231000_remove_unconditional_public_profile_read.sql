-- Remove legacy policy that exposed every profile row to the public role.
-- Admin access is preserved by the existing authenticated admin policies
-- (admin_bypass_select / profiles_admin_all) and service-role policies.

drop policy if exists public_read_admin_ids on public.profiles;
