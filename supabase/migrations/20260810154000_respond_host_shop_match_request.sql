-- Atomic host-shop match response.
-- The API performs session/tenant authorization before invoking this service-role-only RPC.

create or replace function public.respond_host_shop_match_request(
  p_request_id uuid,
  p_responder_id uuid,
  p_status text,
  p_shop_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.host_shop_match_requests%rowtype;
  v_shop record;
  v_placement_id uuid;
  v_count integer;
begin
  if p_status not in ('approved', 'declined') then
    raise exception 'invalid match response status';
  end if;

  select *
    into v_request
    from public.host_shop_match_requests
   where id = p_request_id
     and deleted_at is null
   for update;

  if not found then
    raise exception 'match request not found';
  end if;

  if v_request.status not in ('pending', p_status) then
    raise exception 'match request already resolved';
  end if;

  if p_status = 'approved' then
    select s.id, s.tenant_id, s.partner_id
      into v_shop
      from public.shops s
      join public.partners p on p.id = s.partner_id
     where s.id = v_request.host_shop_id
       and s.active is not false
       and s.tenant_id is not null
       and p.status = 'active'
       and p.approval_status = 'approved'
       and p.is_active is not false
     for update of s;

    if not found then
      raise exception 'host shop is not active and approved';
    end if;

    insert into public.apprentice_placements (
      student_id,
      shop_id,
      program_slug,
      start_date,
      status,
      tenant_id,
      match_request_id,
      created_at,
      updated_at
    ) values (
      v_request.apprentice_id,
      v_request.host_shop_id,
      coalesce(nullif(v_request.program_slug, ''), 'barber-apprenticeship'),
      current_date,
      'active',
      v_shop.tenant_id,
      v_request.id,
      now(),
      now()
    )
    on conflict (student_id, shop_id, program_slug)
    do update set
      status = 'active',
      end_date = null,
      tenant_id = excluded.tenant_id,
      match_request_id = excluded.match_request_id,
      updated_at = now()
    returning id into v_placement_id;
  end if;

  update public.host_shop_match_requests
     set status = p_status,
         shop_notes = nullif(trim(coalesce(p_shop_notes, '')), ''),
         responded_at = now(),
         responded_by = p_responder_id,
         updated_at = now()
   where id = v_request.id;

  if p_status = 'approved' then
    select count(*)::integer
      into v_count
      from public.apprentice_placements
     where shop_id = v_request.host_shop_id
       and status = 'active';

    update public.host_shops
       set current_apprentice_count = v_count,
           updated_at = now()
     where id = v_request.host_shop_id;
  end if;

  return jsonb_build_object(
    'request_id', v_request.id,
    'status', p_status,
    'placement_id', v_placement_id
  );
end;
$$;

revoke all on function public.respond_host_shop_match_request(uuid, uuid, text, text) from public;
revoke all on function public.respond_host_shop_match_request(uuid, uuid, text, text) from anon;
revoke all on function public.respond_host_shop_match_request(uuid, uuid, text, text) from authenticated;
grant execute on function public.respond_host_shop_match_request(uuid, uuid, text, text) to service_role;
