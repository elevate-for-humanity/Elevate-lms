-- Narrow, transactional contract for document review.
-- Production drift left the legacy broad audited_mutation function absent.
-- This function can only review one pending document and append its audit row.

create or replace function public.review_document_with_audit(
  p_document_id uuid,
  p_action text,
  p_actor_id uuid,
  p_rejection_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewed_document public.documents%rowtype;
begin
  if p_document_id is null or p_actor_id is null then
    raise exception 'document and actor are required';
  end if;

  if p_action not in ('approve', 'reject') then
    raise exception 'invalid document review action';
  end if;

  if p_action = 'reject' and nullif(btrim(p_rejection_reason), '') is null then
    raise exception 'a rejection reason is required';
  end if;

  if not exists (select 1 from auth.users where id = p_actor_id) then
    raise exception 'review actor does not exist';
  end if;

  update public.documents
  set
    status = case when p_action = 'approve' then 'approved' else 'rejected' end,
    verification_status = case when p_action = 'approve' then 'verified' else 'rejected' end,
    verified = p_action = 'approve',
    verified_by = case
      when p_action = 'approve' and exists (
        select 1 from public.profiles where id = p_actor_id
      ) then p_actor_id
      else null
    end,
    verified_at = case when p_action = 'approve' then now() else null end,
    reviewed_by = p_actor_id,
    reviewed_at = now(),
    rejection_reason = case when p_action = 'reject' then btrim(p_rejection_reason) else null end
  where id = p_document_id
    and status in ('pending', 'pending_review', 'uploaded', 'submitted')
  returning * into reviewed_document;

  if reviewed_document.id is null then
    raise exception 'pending document was not found';
  end if;

  insert into public.audit_logs (
    action,
    actor_id,
    target_type,
    target_id,
    metadata
  ) values (
    'api:post:/api/admin/documents/review',
    p_actor_id,
    'documents',
    p_document_id::text,
    jsonb_build_object(
      'decision', p_action,
      'transactional', true,
      'operation', 'review'
    )
  );

  return to_jsonb(reviewed_document);
end;
$$;

revoke all on function public.review_document_with_audit(uuid, text, uuid, text) from public;
grant execute on function public.review_document_with_audit(uuid, text, uuid, text) to service_role;

comment on function public.review_document_with_audit(uuid, text, uuid, text) is
  'Atomically approves or rejects one pending document and appends the required audit record.';
