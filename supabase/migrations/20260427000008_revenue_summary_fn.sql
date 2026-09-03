-- Revenue summary RPC functions
--
-- PostgREST aggregate syntax (.sum()) is disabled on this project (PGRST123).
-- These functions replace the three aggregate queries in get-admin-dashboard-data.ts.
--
-- Apply in Supabase Dashboard → SQL Editor.

CREATE OR REPLACE FUNCTION public.get_revenue_all_time()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(amount_paid_cents), 0)::bigint
  FROM public.program_enrollments
  WHERE payment_status IN ('paid', 'completed', 'setup_fee_paid');
$$;

CREATE OR REPLACE FUNCTION public.get_revenue_this_month()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(amount_paid_cents), 0)::bigint
  FROM public.program_enrollments
  WHERE payment_status IN ('paid', 'completed', 'setup_fee_paid')
    AND created_at >= date_trunc('month', now());
$$;

CREATE OR REPLACE FUNCTION public.get_revenue_last_month()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(amount_paid_cents), 0)::bigint
  FROM public.program_enrollments
  WHERE payment_status IN ('paid', 'completed', 'setup_fee_paid')
    AND created_at >= date_trunc('month', now() - interval '1 month')
    AND created_at <  date_trunc('month', now());
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.get_revenue_all_time()    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_revenue_this_month()  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_revenue_last_month()  TO authenticated, service_role;
