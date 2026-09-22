-- Follow-up hardening for organization mailbox membership lifecycle.
-- Keeps test, inactive, unrelated, and profile-less users out of active shared mailboxes.

create or replace function public.communication_email_provision_program_holder(p_program_holder_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  holder record;
  member record;
  resolved_mailbox_id uuid;
begin
  select * into holder from public.program_holders where id = p_program_holder_id;
  if not found then return; end if;
  if lower(coalesce(holder.status, '')) not in ('active', 'approved') then
    update public.communication_email_mailboxes
    set active = false, updated_at = now()
    where mailbox_kind = 'program_holder' and program_holder_id = p_program_holder_id;
    delete from public.communication_email_mailbox_members member_row
    using public.communication_email_mailboxes mailbox
    where member_row.mailbox_id = mailbox.id
      and mailbox.mailbox_kind = 'program_holder'
      and mailbox.program_holder_id = p_program_holder_id;
    return;
  end if;

  resolved_mailbox_id := public.communication_email_ensure_mailbox(
    p_kind => 'program_holder',
    p_display_name => coalesce(
      nullif(holder.organization_name, ''), nullif(holder.name, ''),
      nullif(holder.contact_name, ''), 'Program Office'
    ),
    p_program_holder_id => holder.id,
    p_access_level => 'manager'
  );

  delete from public.communication_email_mailbox_members member_row
  where member_row.mailbox_id = resolved_mailbox_id
    and not exists (
      select 1 from public.profiles profile
      where profile.id = member_row.user_id
        and (profile.id = holder.user_id or profile.program_holder_id = holder.id)
        and coalesce(profile.is_active, true)
        and lower(coalesce(profile.status, 'active')) not in ('inactive', 'archived', 'suspended', 'deleted')
        and not public.communication_email_is_test_identity(
          profile.email,
          coalesce(profile.full_name, concat_ws(' ', profile.first_name, profile.last_name))
        )
    );

  for member in
    select id from public.profiles
    where (id = holder.user_id or program_holder_id = holder.id)
      and coalesce(is_active, true)
      and lower(coalesce(status, 'active')) not in ('inactive', 'archived', 'suspended', 'deleted')
      and not public.communication_email_is_test_identity(
        email, coalesce(full_name, concat_ws(' ', first_name, last_name))
      )
  loop
    insert into public.communication_email_mailbox_members (mailbox_id, user_id, access_level)
    values (resolved_mailbox_id, member.id, 'manager')
    on conflict (mailbox_id, user_id) do update set access_level = excluded.access_level;
  end loop;
end;
$$;

create or replace function public.communication_email_provision_partner(p_partner_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  partner_row record;
  related_user record;
  resolved_mailbox_id uuid;
begin
  select * into partner_row from public.partners where id = p_partner_id;
  if not found then return; end if;
  if not (
    coalesce(partner_row.is_active, true)
    and lower(coalesce(partner_row.status, '')) = 'active'
    and lower(coalesce(partner_row.approval_status, '')) = 'approved'
    and (
      exists (select 1 from public.shops shop where shop.partner_id = partner_row.id and shop.active)
      or exists (
        select 1 from public.partner_users pu
        where pu.partner_id = partner_row.id and coalesce(pu.status, 'active') = 'active'
      )
    )
  ) then
    update public.communication_email_mailboxes
    set active = false, updated_at = now()
    where mailbox_kind = 'host_shop' and partner_id = p_partner_id;
    delete from public.communication_email_mailbox_members member_row
    using public.communication_email_mailboxes mailbox
    where member_row.mailbox_id = mailbox.id
      and mailbox.mailbox_kind = 'host_shop'
      and mailbox.partner_id = p_partner_id;
    return;
  end if;

  resolved_mailbox_id := public.communication_email_ensure_mailbox(
    p_kind => 'host_shop',
    p_display_name => coalesce(nullif(partner_row.name, ''), 'Host Shop'),
    p_partner_id => partner_row.id,
    p_access_level => 'manager'
  );

  delete from public.communication_email_mailbox_members member_row
  where member_row.mailbox_id = resolved_mailbox_id
    and not exists (
      select 1 from public.profiles profile
      where profile.id = member_row.user_id
        and coalesce(profile.is_active, true)
        and lower(coalesce(profile.status, 'active')) not in ('inactive', 'archived', 'suspended', 'deleted')
        and not public.communication_email_is_test_identity(
          profile.email,
          coalesce(profile.full_name, concat_ws(' ', profile.first_name, profile.last_name))
        )
        and (
          exists (
            select 1 from public.partner_users pu
            where pu.partner_id = partner_row.id and pu.user_id = profile.id
              and coalesce(pu.status, 'active') = 'active'
          )
          or exists (
            select 1 from public.shops shop
            where shop.partner_id = partner_row.id and shop.owner_id = profile.id and shop.active
          )
          or exists (
            select 1 from public.shop_staff staff
            join public.shops shop on shop.id = staff.shop_id
            where shop.partner_id = partner_row.id and shop.active
              and staff.user_id = profile.id and staff.active
          )
        )
    );

  for related_user in
    select distinct user_id from (
      select pu.user_id from public.partner_users pu
      where pu.partner_id = partner_row.id and coalesce(pu.status, 'active') = 'active'
      union
      select shop.owner_id from public.shops shop
      where shop.partner_id = partner_row.id and shop.active and shop.owner_id is not null
      union
      select staff.user_id from public.shop_staff staff
      join public.shops shop on shop.id = staff.shop_id
      where shop.partner_id = partner_row.id and shop.active and staff.active
    ) users where user_id is not null
  loop
    perform public.communication_email_provision_user(related_user.user_id);
  end loop;
end;
$$;

create or replace function public.communication_email_sync_shop_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.partner_id is not null then
      perform public.communication_email_provision_partner(old.partner_id);
    end if;
    return old;
  end if;
  if new.partner_id is not null then
    perform public.communication_email_provision_partner(new.partner_id);
  end if;
  if tg_op = 'UPDATE' and old.partner_id is not null and old.partner_id is distinct from new.partner_id then
    perform public.communication_email_provision_partner(old.partner_id);
  end if;
  return new;
end;
$$;

revoke execute on function public.communication_email_provision_program_holder(uuid) from public, anon, authenticated;
revoke execute on function public.communication_email_provision_partner(uuid) from public, anon, authenticated;
revoke execute on function public.communication_email_sync_shop_trigger() from public, anon, authenticated;
grant execute on function public.communication_email_provision_program_holder(uuid) to service_role;
grant execute on function public.communication_email_provision_partner(uuid) to service_role;

select public.communication_email_provision_all();
