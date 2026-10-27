-- Elevate Email workspace and corrected provisioning scope.
-- Personal mailboxes are for active, non-test operational staff only.
-- Program Holders and Host Shops use their approved organization mailbox.

create table if not exists public.communication_email_mailboxes (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  display_name text not null,
  mailbox_kind text not null check (mailbox_kind in ('individual', 'program_holder', 'host_shop', 'department')),
  tenant_id uuid references public.tenants(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete cascade,
  program_holder_id uuid references public.program_holders(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete cascade,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communication_email_mailboxes_lowercase_address check (address = lower(address)),
  constraint communication_email_mailboxes_owner_shape check (
    (mailbox_kind = 'individual' and owner_user_id is not null and program_holder_id is null and partner_id is null)
    or (mailbox_kind = 'program_holder' and owner_user_id is null and program_holder_id is not null and partner_id is null)
    or (mailbox_kind = 'host_shop' and owner_user_id is null and program_holder_id is null and partner_id is not null)
    or (mailbox_kind = 'department' and owner_user_id is null and program_holder_id is null and partner_id is null)
  )
);

create unique index if not exists communication_email_mailboxes_address_key
  on public.communication_email_mailboxes (lower(address));
create unique index if not exists communication_email_mailboxes_individual_owner_key
  on public.communication_email_mailboxes (owner_user_id) where mailbox_kind = 'individual';
create unique index if not exists communication_email_mailboxes_program_holder_key
  on public.communication_email_mailboxes (program_holder_id) where mailbox_kind = 'program_holder';
create unique index if not exists communication_email_mailboxes_partner_key
  on public.communication_email_mailboxes (partner_id) where mailbox_kind = 'host_shop';
create index if not exists communication_email_mailboxes_tenant_idx
  on public.communication_email_mailboxes (tenant_id) where tenant_id is not null;
create index if not exists communication_email_mailboxes_created_by_idx
  on public.communication_email_mailboxes (created_by) where created_by is not null;

create table if not exists public.communication_email_mailbox_members (
  mailbox_id uuid not null references public.communication_email_mailboxes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_level text not null default 'member' check (access_level in ('owner', 'manager', 'member')),
  created_at timestamptz not null default now(),
  primary key (mailbox_id, user_id)
);
create index if not exists communication_email_mailbox_members_user_idx
  on public.communication_email_mailbox_members (user_id);

create table if not exists public.communication_email_threads (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.communication_email_mailboxes(id) on delete cascade,
  subject text not null default '(no subject)',
  normalized_subject text not null default '(no subject)',
  last_message_at timestamptz not null default now(),
  message_count integer not null default 0 check (message_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists communication_email_threads_mailbox_idx
  on public.communication_email_threads (mailbox_id, last_message_at desc);

create table if not exists public.communication_email_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.communication_email_threads(id) on delete cascade,
  mailbox_id uuid not null references public.communication_email_mailboxes(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'received', 'failed')),
  provider_message_id text,
  inbound_event_id text,
  sender_email text not null,
  sender_name text,
  to_addresses text[] not null default '{}',
  cc_addresses text[] not null default '{}',
  bcc_addresses text[] not null default '{}',
  reply_to text,
  subject text not null default '(no subject)',
  text_body text not null default '',
  html_body text,
  sent_by_user_id uuid references auth.users(id) on delete set null,
  error_message text,
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists communication_email_messages_inbound_event_key
  on public.communication_email_messages (inbound_event_id) where inbound_event_id is not null;
create index if not exists communication_email_messages_mailbox_idx
  on public.communication_email_messages (mailbox_id, created_at desc);
create index if not exists communication_email_messages_thread_idx
  on public.communication_email_messages (thread_id, created_at);
create index if not exists communication_email_messages_sent_by_idx
  on public.communication_email_messages (sent_by_user_id) where sent_by_user_id is not null;

create table if not exists public.communication_email_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.communication_email_messages(id) on delete cascade,
  mailbox_id uuid not null references public.communication_email_mailboxes(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null check (size_bytes >= 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);
create index if not exists communication_email_attachments_message_idx
  on public.communication_email_attachments (message_id);
create index if not exists communication_email_attachments_mailbox_idx
  on public.communication_email_attachments (mailbox_id);

create table if not exists public.communication_email_thread_reads (
  thread_id uuid not null references public.communication_email_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
create index if not exists communication_email_thread_reads_user_idx
  on public.communication_email_thread_reads (user_id);

alter table public.communication_email_mailboxes enable row level security;
alter table public.communication_email_mailbox_members enable row level security;
alter table public.communication_email_threads enable row level security;
alter table public.communication_email_messages enable row level security;
alter table public.communication_email_attachments enable row level security;
alter table public.communication_email_thread_reads enable row level security;

drop policy if exists "members read email mailboxes" on public.communication_email_mailboxes;
create policy "members read email mailboxes"
  on public.communication_email_mailboxes for select to authenticated
  using (exists (
    select 1 from public.communication_email_mailbox_members member
    where member.mailbox_id = communication_email_mailboxes.id
      and member.user_id = (select auth.uid())
  ));

drop policy if exists "members read own mailbox memberships" on public.communication_email_mailbox_members;
create policy "members read own mailbox memberships"
  on public.communication_email_mailbox_members for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "members read email threads" on public.communication_email_threads;
create policy "members read email threads"
  on public.communication_email_threads for select to authenticated
  using (exists (
    select 1 from public.communication_email_mailbox_members member
    where member.mailbox_id = communication_email_threads.mailbox_id
      and member.user_id = (select auth.uid())
  ));

drop policy if exists "members read email messages" on public.communication_email_messages;
create policy "members read email messages"
  on public.communication_email_messages for select to authenticated
  using (exists (
    select 1 from public.communication_email_mailbox_members member
    where member.mailbox_id = communication_email_messages.mailbox_id
      and member.user_id = (select auth.uid())
  ));

drop policy if exists "members read email attachments" on public.communication_email_attachments;
create policy "members read email attachments"
  on public.communication_email_attachments for select to authenticated
  using (exists (
    select 1 from public.communication_email_mailbox_members member
    where member.mailbox_id = communication_email_attachments.mailbox_id
      and member.user_id = (select auth.uid())
  ));

drop policy if exists "users manage own email read state" on public.communication_email_thread_reads;
create policy "users manage own email read state"
  on public.communication_email_thread_reads for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.communication_email_threads thread
      join public.communication_email_mailbox_members member on member.mailbox_id = thread.mailbox_id
      where thread.id = communication_email_thread_reads.thread_id
        and member.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.communication_email_threads thread
      join public.communication_email_mailbox_members member on member.mailbox_id = thread.mailbox_id
      where thread.id = communication_email_thread_reads.thread_id
        and member.user_id = (select auth.uid())
    )
  );

grant select on public.communication_email_mailboxes,
  public.communication_email_mailbox_members,
  public.communication_email_threads,
  public.communication_email_messages,
  public.communication_email_attachments to authenticated;
grant select, insert, update, delete on public.communication_email_thread_reads to authenticated;
grant all on public.communication_email_mailboxes,
  public.communication_email_mailbox_members,
  public.communication_email_threads,
  public.communication_email_messages,
  public.communication_email_attachments,
  public.communication_email_thread_reads to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'communication-email-attachments',
  'communication-email-attachments',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/png', 'image/webp', 'text/csv', 'text/plain'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.communication_email_slug(display_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(
      trim(both '.' from substring(
        regexp_replace(
          regexp_replace(replace(replace(lower(coalesce(display_name, '')), '''', ''), '’', ''), '&', ' and ', 'g'),
          '[^a-z0-9]+', '.', 'g'
        ) from 1 for 54
      )),
      ''
    ),
    'mailbox'
  )
$$;

create or replace function public.communication_email_is_eligible_role(role_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(trim(replace(coalesce(role_name, ''), '-', '_'))) = any(array[
    'super_admin', 'admin', 'org_admin', 'staff', 'instructor',
    'case_manager', 'counselor', 'advisor', 'employee', 'support'
  ]::text[])
$$;

create or replace function public.communication_email_is_test_identity(email_value text, name_value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    split_part(lower(coalesce(email_value, '')), '@', 1)
      ~ '(^|[._+-])(test|demo|sample|example|invalid|qa)[0-9._+-]*$'
    or split_part(lower(coalesce(email_value, '')), '@', 2)
      ~ '^((qa[.])?invalid|example[.](com|org|net))$'
    or lower(coalesce(name_value, ''))
      ~ '(^|[[:space:]])(test|demo|sample|example|invalid|qa)([[:space:]]|$)'
$$;

create or replace function public.communication_email_ensure_mailbox(
  p_kind text,
  p_display_name text,
  p_owner_user_id uuid default null,
  p_program_holder_id uuid default null,
  p_partner_id uuid default null,
  p_member_user_id uuid default null,
  p_tenant_id uuid default null,
  p_access_level text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_mailbox_id uuid;
  base_local text := public.communication_email_slug(p_display_name);
  candidate_address text;
  suffix integer := 1;
begin
  select mailbox.id into resolved_mailbox_id
  from public.communication_email_mailboxes mailbox
  where (p_kind = 'individual' and mailbox.mailbox_kind = p_kind and mailbox.owner_user_id = p_owner_user_id)
     or (p_kind = 'program_holder' and mailbox.mailbox_kind = p_kind and mailbox.program_holder_id = p_program_holder_id)
     or (p_kind = 'host_shop' and mailbox.mailbox_kind = p_kind and mailbox.partner_id = p_partner_id)
  limit 1;

  while resolved_mailbox_id is null and suffix <= 500 loop
    candidate_address := base_local || case when suffix = 1 then '' else '-' || suffix::text end || '@elevateforhumanity.org';
    insert into public.communication_email_mailboxes (
      address, display_name, mailbox_kind, tenant_id, owner_user_id,
      program_holder_id, partner_id, created_by
    )
    values (
      candidate_address,
      left(translate(coalesce(nullif(trim(p_display_name), ''), 'Elevate Mailbox'), E'<>"\r\n', ''), 120),
      p_kind, p_tenant_id, p_owner_user_id, p_program_holder_id, p_partner_id, p_member_user_id
    )
    on conflict do nothing
    returning id into resolved_mailbox_id;

    if resolved_mailbox_id is null then
      select mailbox.id into resolved_mailbox_id
      from public.communication_email_mailboxes mailbox
      where (p_kind = 'individual' and mailbox.mailbox_kind = p_kind and mailbox.owner_user_id = p_owner_user_id)
         or (p_kind = 'program_holder' and mailbox.mailbox_kind = p_kind and mailbox.program_holder_id = p_program_holder_id)
         or (p_kind = 'host_shop' and mailbox.mailbox_kind = p_kind and mailbox.partner_id = p_partner_id)
      limit 1;
    end if;
    suffix := suffix + 1;
  end loop;

  if resolved_mailbox_id is null then
    raise exception 'Unable to allocate a unique Elevate email address';
  end if;

  update public.communication_email_mailboxes
  set display_name = left(translate(coalesce(nullif(trim(p_display_name), ''), 'Elevate Mailbox'), E'<>"\r\n', ''), 120),
      tenant_id = coalesce(p_tenant_id, tenant_id),
      active = true,
      updated_at = now()
  where id = resolved_mailbox_id;

  if p_member_user_id is not null then
    insert into public.communication_email_mailbox_members (mailbox_id, user_id, access_level)
    values (resolved_mailbox_id, p_member_user_id, p_access_level)
    on conflict (mailbox_id, user_id) do update set access_level = excluded.access_level;
  end if;
  return resolved_mailbox_id;
end;
$$;

create or replace function public.communication_email_provision_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_row public.profiles%rowtype;
  assigned_roles text[] := array[]::text[];
  holder record;
  partner record;
  department record;
  display_name text;
  lifecycle_eligible boolean := false;
  staff_eligible boolean := false;
  shared_access boolean := false;
begin
  select * into profile_row from public.profiles where id = p_user_id;
  if not found then
    delete from public.communication_email_mailbox_members member
    using public.communication_email_mailboxes mailbox
    where member.mailbox_id = mailbox.id and member.user_id = p_user_id
      and mailbox.mailbox_kind in ('individual', 'department', 'program_holder', 'host_shop');
    update public.communication_email_mailboxes
    set active = false, updated_at = now()
    where mailbox_kind = 'individual' and owner_user_id = p_user_id;
    return;
  end if;

  if nullif(trim(coalesce(profile_row.role, '')), '') is not null then
    assigned_roles := array_append(assigned_roles, lower(trim(replace(profile_row.role, '-', '_'))));
  end if;
  select assigned_roles || coalesce(array_agg(distinct lower(trim(replace(coalesce(role_row.name, assignment.role, ''), '-', '_')))), array[]::text[])
  into assigned_roles
  from public.user_roles assignment
  left join public.roles role_row on role_row.id::text = assignment.role_id::text
  where assignment.user_id = p_user_id
    and (assignment.expires_at is null or assignment.expires_at > now());

  lifecycle_eligible := coalesce(profile_row.is_active, true)
    and lower(coalesce(profile_row.status, 'active')) not in ('inactive', 'archived', 'suspended', 'deleted')
    and not public.communication_email_is_test_identity(
      profile_row.email,
      coalesce(nullif(profile_row.full_name, ''), concat_ws(' ', profile_row.first_name, profile_row.last_name))
    );
  select exists (
    select 1 from unnest(assigned_roles) assigned_role
    where public.communication_email_is_eligible_role(assigned_role)
  ) into staff_eligible;

  delete from public.communication_email_mailbox_members member
  using public.communication_email_mailboxes mailbox
  where member.mailbox_id = mailbox.id and member.user_id = p_user_id
    and mailbox.mailbox_kind = 'program_holder'
    and (
      not lifecycle_eligible
      or not exists (
        select 1 from public.program_holders program_holder
        where program_holder.id = mailbox.program_holder_id
          and lower(coalesce(program_holder.status, '')) in ('active', 'approved')
          and (program_holder.user_id = p_user_id or profile_row.program_holder_id = program_holder.id)
      )
    );

  delete from public.communication_email_mailbox_members member
  using public.communication_email_mailboxes mailbox
  where member.mailbox_id = mailbox.id and member.user_id = p_user_id
    and mailbox.mailbox_kind = 'host_shop'
    and (
      not lifecycle_eligible
      or not exists (
        select 1 from public.partners partner_row
        where partner_row.id = mailbox.partner_id
          and coalesce(partner_row.is_active, true)
          and lower(coalesce(partner_row.status, '')) = 'active'
          and lower(coalesce(partner_row.approval_status, '')) = 'approved'
          and (
            exists (select 1 from public.partner_users pu where pu.partner_id = partner_row.id and pu.user_id = p_user_id and coalesce(pu.status, 'active') = 'active')
            or exists (
              select 1 from public.shop_staff staff
              join public.shops shop on shop.id = staff.shop_id
              where staff.user_id = p_user_id and staff.active and shop.active and shop.partner_id = partner_row.id
            )
            or exists (select 1 from public.shops shop where shop.partner_id = partner_row.id and shop.owner_id = p_user_id and shop.active)
          )
      )
    );

  if lifecycle_eligible and staff_eligible then
    display_name := coalesce(
      nullif(trim(profile_row.full_name), ''),
      nullif(trim(concat_ws(' ', profile_row.first_name, profile_row.last_name)), ''),
      split_part(coalesce(profile_row.email, 'team.member'), '@', 1),
      'Elevate Team Member'
    );
    perform public.communication_email_ensure_mailbox(
      p_kind => 'individual', p_display_name => display_name,
      p_owner_user_id => p_user_id, p_member_user_id => p_user_id,
      p_tenant_id => profile_row.tenant_id, p_access_level => 'owner'
    );
  else
    delete from public.communication_email_mailbox_members member
    using public.communication_email_mailboxes mailbox
    where member.mailbox_id = mailbox.id and member.user_id = p_user_id
      and mailbox.mailbox_kind = 'individual';
    update public.communication_email_mailboxes
    set active = false, updated_at = now()
    where mailbox_kind = 'individual' and owner_user_id = p_user_id;
  end if;

  if lifecycle_eligible then
    for holder in
      select distinct program_holder.id,
        coalesce(nullif(program_holder.organization_name, ''), nullif(program_holder.name, ''), nullif(program_holder.contact_name, ''), 'Program Office') as display_name
      from public.program_holders program_holder
      where lower(coalesce(program_holder.status, '')) in ('active', 'approved')
        and (program_holder.user_id = p_user_id or program_holder.id = profile_row.program_holder_id)
    loop
      perform public.communication_email_ensure_mailbox(
        p_kind => 'program_holder', p_display_name => holder.display_name,
        p_program_holder_id => holder.id, p_member_user_id => p_user_id,
        p_tenant_id => profile_row.tenant_id, p_access_level => 'manager'
      );
    end loop;

    for partner in
      select distinct partner_row.id, coalesce(nullif(partner_row.name, ''), 'Host Shop') as display_name
      from public.partners partner_row
      where coalesce(partner_row.is_active, true)
        and lower(coalesce(partner_row.status, '')) = 'active'
        and lower(coalesce(partner_row.approval_status, '')) = 'approved'
        and (
          exists (select 1 from public.partner_users pu where pu.partner_id = partner_row.id and pu.user_id = p_user_id and coalesce(pu.status, 'active') = 'active')
          or exists (
            select 1 from public.shop_staff staff
            join public.shops shop on shop.id = staff.shop_id
            where staff.user_id = p_user_id and staff.active and shop.active and shop.partner_id = partner_row.id
          )
          or exists (select 1 from public.shops shop where shop.partner_id = partner_row.id and shop.owner_id = p_user_id and shop.active)
        )
    loop
      perform public.communication_email_ensure_mailbox(
        p_kind => 'host_shop', p_display_name => partner.display_name,
        p_partner_id => partner.id, p_member_user_id => p_user_id,
        p_tenant_id => profile_row.tenant_id, p_access_level => 'manager'
      );
    end loop;
  end if;

  select lifecycle_eligible and exists (
    select 1 from unnest(assigned_roles) assigned_role
    where assigned_role = any(array[
      'super_admin', 'admin', 'org_admin', 'staff', 'employee',
      'support', 'case_manager', 'counselor', 'advisor'
    ]::text[])
  ) into shared_access;
  if shared_access then
    for department in
      select id from public.communication_email_mailboxes
      where mailbox_kind = 'department' and active
    loop
      insert into public.communication_email_mailbox_members (mailbox_id, user_id, access_level)
      values (department.id, p_user_id, 'manager')
      on conflict (mailbox_id, user_id) do update set access_level = excluded.access_level;
    end loop;
  else
    delete from public.communication_email_mailbox_members member
    using public.communication_email_mailboxes mailbox
    where member.mailbox_id = mailbox.id and member.user_id = p_user_id
      and mailbox.mailbox_kind = 'department';
  end if;
end;
$$;

create or replace function public.communication_email_provision_program_holder(p_program_holder_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare holder record; member record; resolved_mailbox_id uuid;
begin
  select * into holder from public.program_holders where id = p_program_holder_id;
  if not found then return; end if;
  if lower(coalesce(holder.status, '')) not in ('active', 'approved') then
    update public.communication_email_mailboxes set active = false, updated_at = now()
    where mailbox_kind = 'program_holder' and program_holder_id = p_program_holder_id;
    delete from public.communication_email_mailbox_members member_row
    using public.communication_email_mailboxes mailbox
    where member_row.mailbox_id = mailbox.id and mailbox.mailbox_kind = 'program_holder'
      and mailbox.program_holder_id = p_program_holder_id;
    return;
  end if;
  resolved_mailbox_id := public.communication_email_ensure_mailbox(
    p_kind => 'program_holder',
    p_display_name => coalesce(nullif(holder.organization_name, ''), nullif(holder.name, ''), nullif(holder.contact_name, ''), 'Program Office'),
    p_program_holder_id => holder.id, p_access_level => 'manager'
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
    where (id = holder.user_id or program_holder_id = holder.id) and coalesce(is_active, true)
      and lower(coalesce(status, 'active')) not in ('inactive', 'archived', 'suspended', 'deleted')
      and not public.communication_email_is_test_identity(email, coalesce(full_name, concat_ws(' ', first_name, last_name)))
  loop
    insert into public.communication_email_mailbox_members (mailbox_id, user_id, access_level)
    values (resolved_mailbox_id, member.id, 'manager')
    on conflict (mailbox_id, user_id) do update set access_level = excluded.access_level;
  end loop;
end;
$$;

create or replace function public.communication_email_provision_partner(p_partner_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare partner_row record; related_user record; resolved_mailbox_id uuid;
begin
  select * into partner_row from public.partners where id = p_partner_id;
  if not found then return; end if;
  if not (
    coalesce(partner_row.is_active, true)
    and lower(coalesce(partner_row.status, '')) = 'active'
    and lower(coalesce(partner_row.approval_status, '')) = 'approved'
    and (
      exists (select 1 from public.shops shop where shop.partner_id = partner_row.id and shop.active)
      or exists (select 1 from public.partner_users pu where pu.partner_id = partner_row.id and coalesce(pu.status, 'active') = 'active')
    )
  ) then
    update public.communication_email_mailboxes set active = false, updated_at = now()
    where mailbox_kind = 'host_shop' and partner_id = p_partner_id;
    delete from public.communication_email_mailbox_members member_row
    using public.communication_email_mailboxes mailbox
    where member_row.mailbox_id = mailbox.id and mailbox.mailbox_kind = 'host_shop'
      and mailbox.partner_id = p_partner_id;
    return;
  end if;
  resolved_mailbox_id := public.communication_email_ensure_mailbox(
    p_kind => 'host_shop', p_display_name => coalesce(nullif(partner_row.name, ''), 'Host Shop'),
    p_partner_id => partner_row.id, p_access_level => 'manager'
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

create or replace function public.communication_email_provision_all()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare profile_row record; holder record; partner_row record;
begin
  update public.communication_email_mailboxes mailbox
  set active = false, updated_at = now()
  where mailbox.mailbox_kind = 'individual'
    and not exists (select 1 from public.profiles profile where profile.id = mailbox.owner_user_id);
  delete from public.communication_email_mailbox_members member
  where not exists (select 1 from public.profiles profile where profile.id = member.user_id);
  delete from public.communication_email_mailbox_members member
  using public.communication_email_mailboxes mailbox
  where member.mailbox_id = mailbox.id and not mailbox.active;

  for profile_row in select id from public.profiles loop
    perform public.communication_email_provision_user(profile_row.id);
  end loop;
  for holder in select id from public.program_holders loop
    perform public.communication_email_provision_program_holder(holder.id);
  end loop;
  for partner_row in select id from public.partners loop
    perform public.communication_email_provision_partner(partner_row.id);
  end loop;
  delete from public.communication_email_mailbox_members member
  using public.communication_email_mailboxes mailbox
  where member.mailbox_id = mailbox.id and not mailbox.active;
  return jsonb_build_object(
    'active_mailboxes', (select count(*) from public.communication_email_mailboxes where active),
    'memberships', (select count(*) from public.communication_email_mailbox_members)
  );
end;
$$;

create or replace function public.communication_email_sync_user_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform public.communication_email_provision_user(case when tg_table_name = 'profiles' then old.id else old.user_id end);
    return old;
  end if;
  perform public.communication_email_provision_user(case when tg_table_name = 'profiles' then new.id else new.user_id end);
  if tg_op = 'UPDATE' and tg_table_name <> 'profiles' and old.user_id is distinct from new.user_id then
    perform public.communication_email_provision_user(old.user_id);
  end if;
  return new;
end;
$$;

create or replace function public.communication_email_sync_program_holder_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.user_id is not null then perform public.communication_email_provision_user(old.user_id); end if;
    return old;
  end if;
  perform public.communication_email_provision_program_holder(new.id);
  if new.user_id is not null then perform public.communication_email_provision_user(new.user_id); end if;
  if tg_op = 'UPDATE' and old.user_id is not null and old.user_id is distinct from new.user_id then
    perform public.communication_email_provision_user(old.user_id);
  end if;
  return new;
end;
$$;

create or replace function public.communication_email_sync_partner_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then return old; end if;
  perform public.communication_email_provision_partner(new.id);
  return new;
end;
$$;

create or replace function public.communication_email_sync_shop_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
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

drop trigger if exists communication_email_profiles_sync on public.profiles;
create trigger communication_email_profiles_sync
after insert or update of role, full_name, first_name, last_name, email, tenant_id, program_holder_id, is_active, status
on public.profiles for each row execute function public.communication_email_sync_user_trigger();

drop trigger if exists communication_email_user_roles_sync on public.user_roles;
create trigger communication_email_user_roles_sync
after insert or update or delete on public.user_roles
for each row execute function public.communication_email_sync_user_trigger();

drop trigger if exists communication_email_program_holders_sync on public.program_holders;
create trigger communication_email_program_holders_sync
after insert or update or delete on public.program_holders
for each row execute function public.communication_email_sync_program_holder_trigger();

drop trigger if exists communication_email_partner_users_sync on public.partner_users;
create trigger communication_email_partner_users_sync
after insert or update or delete on public.partner_users
for each row execute function public.communication_email_sync_user_trigger();

drop trigger if exists communication_email_shop_staff_sync on public.shop_staff;
create trigger communication_email_shop_staff_sync
after insert or update or delete on public.shop_staff
for each row execute function public.communication_email_sync_user_trigger();

drop trigger if exists communication_email_partners_sync on public.partners;
create trigger communication_email_partners_sync
after insert or update of name, status, approval_status, is_active on public.partners
for each row execute function public.communication_email_sync_partner_trigger();

drop trigger if exists communication_email_shops_sync on public.shops;
create trigger communication_email_shops_sync
after insert or update or delete on public.shops
for each row execute function public.communication_email_sync_shop_trigger();

insert into public.communication_email_mailboxes (address, display_name, mailbox_kind)
values
  ('admissions@elevateforhumanity.org', 'Elevate Admissions', 'department'),
  ('contact@elevateforhumanity.org', 'Elevate Contact', 'department'),
  ('enrollment@elevateforhumanity.org', 'Elevate Enrollment', 'department'),
  ('info@elevateforhumanity.org', 'Elevate Information', 'department'),
  ('support@elevateforhumanity.org', 'Elevate Support', 'department')
on conflict do nothing;

revoke execute on function public.communication_email_ensure_mailbox(text, text, uuid, uuid, uuid, uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.communication_email_provision_user(uuid) from public, anon, authenticated;
revoke execute on function public.communication_email_provision_program_holder(uuid) from public, anon, authenticated;
revoke execute on function public.communication_email_provision_partner(uuid) from public, anon, authenticated;
revoke execute on function public.communication_email_provision_all() from public, anon, authenticated;
revoke execute on function public.communication_email_sync_user_trigger() from public, anon, authenticated;
revoke execute on function public.communication_email_sync_program_holder_trigger() from public, anon, authenticated;
revoke execute on function public.communication_email_sync_partner_trigger() from public, anon, authenticated;
revoke execute on function public.communication_email_sync_shop_trigger() from public, anon, authenticated;
grant execute on function public.communication_email_ensure_mailbox(text, text, uuid, uuid, uuid, uuid, uuid, text) to service_role;
grant execute on function public.communication_email_provision_user(uuid) to service_role;
grant execute on function public.communication_email_provision_program_holder(uuid) to service_role;
grant execute on function public.communication_email_provision_partner(uuid) to service_role;
grant execute on function public.communication_email_provision_all() to service_role;

select public.communication_email_provision_all();
