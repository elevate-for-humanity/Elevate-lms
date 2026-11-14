-- 20260629000002_revenue_rpc.sql
-- admin_revenue_summary(month_start, last_month_start, last_month_end)
--
-- Replaces 3 separate SELECT amount_paid_cents queries that transferred all
-- paid enrollment rows to the JS process for summing. This does the
-- aggregation in Postgres and returns a single row with three totals.
--
-- Returns exactly one row. If no paid enrollments exist, all values are 0.

CREATE OR REPLACE FUNCTION public.admin_revenue_summary(
  month_start      timestamptz,
  last_month_start timestamptz,
  last_month_end   timestamptz
)
RETURNS TABLE (
  all_time_cents      bigint,
  this_month_cents    bigint,
  last_month_cents    bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(amount_paid_cents), 0)::bigint                                                        AS all_time_cents,
    COALESCE(SUM(amount_paid_cents) FILTER (WHERE created_at >= month_start), 0)::bigint               AS this_month_cents,
    COALESCE(SUM(amount_paid_cents) FILTER (WHERE created_at >= last_month_start
                                              AND created_at <  last_month_end), 0)::bigint            AS last_month_cents
  FROM public.program_enrollments
  WHERE payment_status IN ('paid', 'completed', 'setup_fee_paid');
$$;

-- Grant execute to the service role used by the admin dashboard
GRANT EXECUTE ON FUNCTION public.admin_revenue_summary(timestamptz, timestamptz, timestamptz)
  TO service_role;
