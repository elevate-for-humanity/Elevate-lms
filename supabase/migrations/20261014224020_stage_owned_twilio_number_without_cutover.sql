-- Stage the purchased number without changing any active routing or sender.
do $$
declare owned_system uuid; system_count integer;
begin
  select count(*), min(id::text)::uuid into system_count, owned_system
  from public.phone_systems where tenant_id is null and name = 'Elevate Communications';
  if system_count <> 1 then raise exception 'Owned phone workspace must be unambiguous'; end if;
  perform 1 from public.phone_systems where id = owned_system for update;
  if exists(select 1 from public.phone_numbers where e164 = '+14632401404' and phone_system_id <> owned_system) then
    raise exception 'Number is already associated with another workspace';
  end if;
  if exists(select 1 from public.phone_numbers where phone_system_id=owned_system and e164='+14632401404'
    and (provider is distinct from 'twilio' or provider_number_id is distinct from 'PN98930da7084d809ab410e1ece0115632')) then
    raise exception 'Existing number provider ownership requires review';
  end if;
  insert into public.phone_numbers(phone_system_id,e164,label,source,provider,provider_number_id,capabilities,status,is_primary)
  values(owned_system,'+14632401404','Elevate Twilio — awaiting verified PBX cutover','provider','twilio',
    'PN98930da7084d809ab410e1ece0115632','{"voice":true,"sms":false,"mms":false}'::jsonb,'pending',false)
  on conflict(phone_system_id,e164) do nothing;
end;
$$;
