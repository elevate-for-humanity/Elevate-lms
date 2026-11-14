CREATE TABLE public.individual_app_deliveries (
 invoice_id uuid PRIMARY KEY REFERENCES public.billing_invoices(id),
 user_id uuid NOT NULL REFERENCES auth.users(id), app_slug text NOT NULL, receipt jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.individual_app_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.individual_app_deliveries FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.individual_app_deliveries TO service_role;
CREATE OR REPLACE FUNCTION public.apply_paid_individual_app_subscription(p_invoice_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE invoice public.billing_invoices; buyer uuid; app text; selected_plan text; ending timestamptz; snapshot jsonb; prior jsonb;
BEGIN
 SELECT * INTO invoice FROM public.billing_invoices WHERE id=p_invoice_id AND status='paid' AND provider='quickbooks'
 AND fulfillment_type='individual_app_subscription' AND paid_at IS NOT NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Verified paid app invoice required'; END IF;
 buyer:=(invoice.fulfillment_payload->>'user_id')::uuid; app:=invoice.fulfillment_payload->>'app_slug'; selected_plan:=invoice.fulfillment_payload->>'plan_id';
 IF buyer IS NULL OR app IS NULL OR app NOT IN ('website-builder','sam-gov','grants') OR selected_plan IS NULL OR selected_plan NOT IN ('starter','professional','enterprise') OR COALESCE(invoice.total_cents,0)<=0
 THEN RAISE EXCEPTION 'Invalid paid app invoice'; END IF;
 snapshot:=jsonb_build_object('user_id',buyer,'app_slug',app,'plan_id',selected_plan,'paid_at',invoice.paid_at,'total_cents',invoice.total_cents);
 PERFORM pg_advisory_xact_lock(hashtextextended(buyer::text||':'||app,0));
 SELECT receipt INTO prior FROM public.individual_app_deliveries WHERE invoice_id=p_invoice_id;
 IF FOUND THEN
  IF prior IS DISTINCT FROM snapshot THEN RAISE EXCEPTION 'Paid app invoice changed after delivery'; END IF;
  RETURN;
 END IF;
 ending:=((invoice.paid_at AT TIME ZONE 'UTC')+interval '1 month') AT TIME ZONE 'UTC';
 INSERT INTO public.user_app_subscriptions(user_id,app_slug,plan,status,trial_ends_at,current_period_start,current_period_end,billing_provider,provider_subscription_id,updated_at)
 VALUES(buyer,app,selected_plan,'active',NULL,invoice.paid_at,ending,'quickbooks','schedule:user:'||buyer||':individual-app-'||app,invoice.paid_at)
 ON CONFLICT(user_id,app_slug) DO UPDATE SET plan=excluded.plan,status='active',trial_ends_at=NULL,
  current_period_start=excluded.current_period_start,current_period_end=excluded.current_period_end,billing_provider='quickbooks',provider_subscription_id=excluded.provider_subscription_id,updated_at=excluded.updated_at
 WHERE public.user_app_subscriptions.current_period_start IS NULL OR public.user_app_subscriptions.current_period_start<excluded.current_period_start;
 INSERT INTO public.individual_app_deliveries(invoice_id,user_id,app_slug,receipt) VALUES(p_invoice_id,buyer,app,snapshot);
END $$;
REVOKE ALL ON FUNCTION public.apply_paid_individual_app_subscription(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paid_individual_app_subscription(uuid) TO service_role;
