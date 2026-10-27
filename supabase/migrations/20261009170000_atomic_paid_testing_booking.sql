-- Reserve all seats and create the paid booking together. Lock the invoice
-- first so concurrent fulfillment retries cannot reserve the same seats twice.
create or replace function public.fulfill_paid_testing_booking(p_invoice_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  invoice public.billing_invoices%rowtype;
  slot public.testing_slots%rowtype;
  booking public.exam_bookings%rowtype;
  payload jsonb;
  participants integer;
  customer_name text;
  local_start timestamp;
begin
  select * into invoice from public.billing_invoices where id=p_invoice_id for update;
  if not found or invoice.status <> 'paid' or invoice.fulfillment_type <> 'testing_booking' then
    raise exception 'A paid testing invoice is required';
  end if;
  select * into booking from public.exam_bookings where provider_invoice_id=p_invoice_id;
  if found then
    return jsonb_build_object('created',false,'booking',to_jsonb(booking));
  end if;
  payload := invoice.fulfillment_payload;
  participants := (payload->>'participant_count')::integer;
  if participants is null or participants < 1 or participants > 100 or
     (payload->>'amount_cents')::bigint is distinct from invoice.total_cents then
    raise exception 'Testing payment does not match the booking';
  end if;
  select * into slot from public.testing_slots where id=(payload->>'slot_id')::uuid for update;
  if not found or slot.is_cancelled or slot.start_time <= now() or
     slot.exam_type not in ('all',payload->>'exam_type') or
     slot.booked_count + participants > slot.capacity then
    raise exception 'Paid testing appointment needs staff rescheduling';
  end if;
  customer_name := trim(coalesce(payload->>'customer_name','Customer'));
  local_start := slot.start_time at time zone 'America/New_York';
  insert into public.exam_bookings (
    exam_type,exam_name,booking_type,first_name,last_name,email,participant_count,
    status,payment_status,fee_cents,confirmation_code,add_on,add_on_paid,slot_id,
    provider,provider_invoice_id,preferred_date,preferred_time,confirmed_date,confirmed_time
  ) values (
    payload->>'exam_type',payload->>'exam_name',payload->>'booking_type',
    split_part(customer_name,' ',1),trim(substr(customer_name,length(split_part(customer_name,' ',1))+1)),
    payload->>'customer_email',participants,'confirmed','paid',invoice.total_cents,
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
    coalesce((payload->>'add_on')::boolean,false),coalesce((payload->>'add_on')::boolean,false),slot.id,
    'quickbooks',invoice.id,local_start::date,to_char(local_start,'HH24:MI'),
    local_start::date,to_char(local_start,'HH24:MI')
  ) returning * into booking;
  update public.testing_slots set booked_count=booked_count+participants,updated_at=now() where id=slot.id;
  return jsonb_build_object('created',true,'booking',to_jsonb(booking));
end;
$$;
revoke all on function public.fulfill_paid_testing_booking(uuid) from public,anon,authenticated;
grant execute on function public.fulfill_paid_testing_booking(uuid) to service_role;
