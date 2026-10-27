-- Rollback-only aggregate regression: no invoices or provider calls persist.
BEGIN ISOLATION LEVEL REPEATABLE READ;
DO $$
DECLARE v_before record; v_after record; v_now timestamptz:=now();
  v_prefix text:='qa-paid-invoice-snapshot-'||gen_random_uuid()::text;
  v_unknown uuid; v_boundary timestamptz;
BEGIN
  SELECT * INTO v_before FROM public.get_admin_paid_invoice_totals(v_now);
  INSERT INTO public.billing_invoices(provider,idempotency_key,customer_external_key,customer_email,total_cents,currency,status,paid_at)
    SELECT 'quickbooks',v_prefix||'-'||n,'qa-test-only','qa@example.invalid',100,'USD','paid',v_now
    FROM generate_series(1,1001) n;
  INSERT INTO public.billing_invoices(provider,idempotency_key,customer_external_key,customer_email,total_cents,currency,status,paid_at)
    VALUES('quickbooks',v_prefix||'-open','qa-test-only','qa@example.invalid',999999,'USD','open',NULL);
  v_boundary := (date_trunc('month',v_now AT TIME ZONE 'America/Indiana/Indianapolis')
    AT TIME ZONE 'America/Indiana/Indianapolis')-interval '1 hour';
  INSERT INTO public.billing_invoices(provider,idempotency_key,customer_external_key,customer_email,total_cents,currency,status,paid_at)
    VALUES('quickbooks',v_prefix||'-boundary','qa-test-only','qa@example.invalid',200,'USD','paid',v_boundary);
  SELECT * INTO v_after FROM public.get_admin_paid_invoice_totals(v_now);
  IF v_after.all_time_cents::numeric-v_before.all_time_cents::numeric<>100300 OR
     v_after.this_month_cents::numeric-v_before.this_month_cents::numeric<>100100 OR
     v_after.paid_count-v_before.paid_count<>1002 THEN
    RAISE EXCEPTION 'INVOICE_AGGREGATE_REGRESSION: cents, row coverage, status or timezone boundary is wrong';
  END IF;
  INSERT INTO public.billing_invoices(provider,idempotency_key,customer_external_key,customer_email,total_cents,currency,status,paid_at)
    VALUES('quickbooks',v_prefix||'-unknown','qa-test-only','qa@example.invalid',100,'USD','paid',NULL) RETURNING id INTO v_unknown;
  SELECT * INTO v_after FROM public.get_admin_paid_invoice_totals(v_now);
  IF v_after.month_available IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'INVOICE_DATE_REGRESSION: undated payment produced a complete monthly total';
  END IF;
  UPDATE public.billing_invoices SET paid_at=v_now WHERE id=v_unknown;
  SELECT * INTO v_after FROM public.get_admin_paid_invoice_totals(v_now);
  IF v_after.all_time_available IS DISTINCT FROM v_before.all_time_available OR
     v_after.month_available IS DISTINCT FROM v_before.month_available THEN
    RAISE EXCEPTION 'INVOICE_AVAILABILITY_REGRESSION: valid rows altered baseline source completeness';
  END IF;
  IF has_function_privilege('anon','public.get_admin_paid_invoice_totals(timestamptz)','EXECUTE') OR
     has_function_privilege('authenticated','public.get_admin_paid_invoice_totals(timestamptz)','EXECUTE') THEN
    RAISE EXCEPTION 'INVOICE_AUTHORIZATION_REGRESSION: browser roles can read aggregate receipts';
  END IF;
END $$;
ROLLBACK;
SELECT NOT EXISTS(SELECT 1 FROM public.billing_invoices WHERE idempotency_key LIKE 'qa-paid-invoice-snapshot-%') AS test_invoices_removed;
