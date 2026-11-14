-- One database snapshot, documented USD-cent units and an explicit paid-invoice
-- scope. This does not blend enrollment balances or historical receipt copies.
CREATE OR REPLACE FUNCTION public.get_admin_paid_invoice_totals(p_now timestamptz DEFAULT now())
RETURNS TABLE(all_time_cents text,this_month_cents text,paid_count bigint,
  all_time_available boolean,month_available boolean)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH bounds AS (
    SELECT date_trunc('month',p_now AT TIME ZONE 'America/Indiana/Indianapolis')
      AT TIME ZONE 'America/Indiana/Indianapolis' AS month_start,
      (date_trunc('month',p_now AT TIME ZONE 'America/Indiana/Indianapolis')+interval '1 month')
      AT TIME ZONE 'America/Indiana/Indianapolis' AS month_end
  ), invoices AS (
    SELECT total_cents,currency,paid_at FROM public.billing_invoices WHERE status='paid'
  )
  SELECT
    coalesce(sum(total_cents::numeric) FILTER(WHERE total_cents>=0 AND upper(currency)='USD'),0)::text,
    coalesce(sum(total_cents::numeric) FILTER(WHERE total_cents>=0 AND upper(currency)='USD'
      AND paid_at>=bounds.month_start AND paid_at<bounds.month_end AND paid_at<=p_now+interval '1 minute'),0)::text,
    count(*)::bigint,
    count(*) FILTER(WHERE total_cents IS NULL OR total_cents<0 OR upper(currency) IS DISTINCT FROM 'USD')=0,
    count(*) FILTER(WHERE total_cents IS NULL OR total_cents<0 OR upper(currency) IS DISTINCT FROM 'USD'
      OR paid_at IS NULL OR paid_at>p_now+interval '1 minute')=0
  FROM invoices CROSS JOIN bounds;
$$;
REVOKE ALL ON FUNCTION public.get_admin_paid_invoice_totals(timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_paid_invoice_totals(timestamptz) TO service_role;
