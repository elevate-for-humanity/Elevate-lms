CREATE OR REPLACE FUNCTION public.get_store_paid_subscription_invoice(p_invoice_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('id',id,'provider',provider,'provider_invoice_id',provider_invoice_id,
  'status',status,'total_cents',total_cents,'paid_at',paid_at,'fulfillment_type',fulfillment_type,'fulfillment_payload',fulfillment_payload)
 FROM public.billing_invoices WHERE id=p_invoice_id AND provider='quickbooks' AND status='paid'
  AND paid_at IS NOT NULL AND fulfillment_type IN ('platform_subscription','individual_app_subscription');
$$;
REVOKE ALL ON FUNCTION public.get_store_paid_subscription_invoice(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_paid_subscription_invoice(uuid) TO service_role;
