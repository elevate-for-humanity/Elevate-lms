-- Keep every finalized packet revision so an acceptance can always resolve the
-- exact legal text that was signed, even after an administrator replaces it.
create table if not exists public.achieve_cna_packet_revisions (
  id uuid primary key default gen_random_uuid(),
  program_holder_id uuid not null references public.program_holders(id),
  packet_digest text not null check (packet_digest ~ '^[0-9a-f]{64}$'),
  packet jsonb not null check (jsonb_typeof(packet) = 'object'),
  approval_reference text not null,
  published_by uuid not null references auth.users(id),
  supersedes_revision_id uuid references public.achieve_cna_packet_revisions(id),
  published_at timestamptz not null default now()
);

alter table public.achieve_cna_packet_revisions enable row level security;

create policy achieve_cna_packet_revisions_admin_read
  on public.achieve_cna_packet_revisions for select to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.role in ('admin', 'super_admin') and p.is_active is not false and p.suspended is not true
  ));

revoke all on public.achieve_cna_packet_revisions from public, anon, authenticated;
grant select on public.achieve_cna_packet_revisions to authenticated;
grant select, insert on public.achieve_cna_packet_revisions to service_role;

create or replace function public.reject_achieve_cna_packet_revision_mutation()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  raise check_violation using message = 'Achieve CNA packet revisions are immutable';
end;
$$;

drop trigger if exists achieve_cna_packet_revisions_immutable on public.achieve_cna_packet_revisions;
create trigger achieve_cna_packet_revisions_immutable
before update or delete on public.achieve_cna_packet_revisions
for each row execute function public.reject_achieve_cna_packet_revision_mutation();

-- The admin publication records the approved text, immutable revision, current
-- revision pointer and audit event atomically.
create or replace function public.publish_achieve_cna_packet_v1(
  p_actor_id uuid, p_expected jsonb, p_packet jsonb, p_packet_digest text
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_holder_id constant uuid := 'acc9f5ab-8804-432e-9b12-aac1a6c86426';
  v_holder public.program_holders%rowtype;
  v_prior_revision_id uuid;
  v_revision_id uuid;
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
    or p_packet_digest !~ '^[0-9a-f]{64}$'
    or not (p_packet ?& array['mou', 'nda', 'program_scope', 'incorporated_terms', 'approval_reference', 'schedule_a'])
    or (select count(*) from jsonb_object_keys(p_packet)) <> 6
    or exists (
      select from (values
        ('mou', 32000),
        ('nda', 32000),
        ('program_scope', 32000),
        ('incorporated_terms', 32000),
        ('approval_reference', 300)
      ) limits(field, max_length)
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
  begin
    v_prior_revision_id := nullif(v_holder.features->>'achieve_cna_current_revision_id', '')::uuid;
  exception when invalid_text_representation then
    raise check_violation using message = 'The current packet revision is invalid';
  end;

  if v_prior_revision_id is not null and p_packet = p_expected then
    return v_prior_revision_id;
  end if;

  insert into public.achieve_cna_packet_revisions (
    program_holder_id, packet_digest, packet, approval_reference, published_by, supersedes_revision_id
  ) values (
    v_holder_id, p_packet_digest, p_packet, p_packet->>'approval_reference', p_actor_id, v_prior_revision_id
  )
  returning id into v_revision_id;

  update public.program_holders
  set features = jsonb_set(
        jsonb_set(coalesce(features, '{}'::jsonb), '{achieve_cna_agreements}', p_packet),
        '{achieve_cna_current_revision_id}', to_jsonb(v_revision_id::text)
      ),
      updated_at = now()
  where id = v_holder_id;

  insert into public.admin_audit_events (action, actor_user_id, target_type, target_id, metadata)
  values ('program_holder.publish_achieve_cna_agreements', p_actor_id, 'program_holder', v_holder_id,
    jsonb_build_object(
      'approval_reference', p_packet->>'approval_reference',
      'packet_digest', p_packet_digest,
      'packet_revision_id', v_revision_id,
      'supersedes_revision_id', v_prior_revision_id,
      'replaced_packet', p_expected is not null
    ));

  return v_revision_id;
end;
$$;

revoke all on function public.publish_achieve_cna_packet_v1(uuid, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.publish_achieve_cna_packet_v1(uuid, jsonb, jsonb, text) to service_role;
