-- The admin publication records the approved text and audit event atomically.
create or replace function public.publish_achieve_cna_packet_v1(
  p_actor_id uuid, p_expected jsonb, p_packet jsonb
) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_holder_id constant uuid := 'acc9f5ab-8804-432e-9b12-aac1a6c86426';
  v_holder public.program_holders%rowtype;
begin
  if not exists (select 1 from public.profiles p where p.id = p_actor_id
    and p.role in ('admin', 'super_admin') and p.is_active is not false and p.suspended is not true) then
    raise insufficient_privilege using message = 'Administrator approval required';
  end if;

  select * into v_holder from public.program_holders where id = v_holder_id for update;
  if not found or v_holder.approved_at is null
    or lower(coalesce(v_holder.status, '')) not in ('approved', 'approved_pending_mou', 'active')
    or (v_holder.features->'achieve_cna_agreements') is distinct from p_expected then
    raise check_violation using message = 'The approved holder or current packet changed';
  end if;
  if p_packet is null or jsonb_typeof(p_packet) <> 'object'
    or not (p_packet ?& array['mou', 'nda', 'approval_reference', 'schedule_a'])
    or (select count(*) from jsonb_object_keys(p_packet)) <> 4
    or exists (
      select from (values ('mou', 32000), ('nda', 32000), ('approval_reference', 300)) limits(field, max_length)
      where jsonb_typeof(p_packet->limits.field) is distinct from 'string'
        or length(btrim(p_packet->>limits.field)) not between 1 and limits.max_length
    )
    or jsonb_typeof(p_packet->'schedule_a') <> 'object'
    or not (p_packet->'schedule_a' ?& array['collecting_party','disbursement_method','invoice_evidence','invoice_due_dates','payment_timing','refund_allocation'])
    or (select count(*) from jsonb_object_keys(p_packet->'schedule_a')) <> 6
    or exists (
      select from jsonb_each(p_packet->'schedule_a') item
      where jsonb_typeof(item.value) <> 'string' or length(btrim(item.value #>> '{}')) not between 1 and 4000
    ) then
    raise check_violation using message = 'The finalized packet is incomplete';
  end if;
  if p_packet = p_expected then return; end if;

  update public.program_holders
  set features = jsonb_set(coalesce(features, '{}'::jsonb), '{achieve_cna_agreements}', p_packet),
      updated_at = now()
  where id = v_holder_id;

  insert into public.admin_audit_events (action, actor_user_id, target_type, target_id, metadata)
  values ('program_holder.publish_achieve_cna_agreements', p_actor_id, 'program_holder', v_holder_id,
    jsonb_build_object('approval_reference', p_packet->>'approval_reference', 'replaced_packet', p_expected is not null));
end;
$$;

revoke all on function public.publish_achieve_cna_packet_v1(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.publish_achieve_cna_packet_v1(uuid, jsonb, jsonb) to service_role;
