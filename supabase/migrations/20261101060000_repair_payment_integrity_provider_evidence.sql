-- Keep historical payments visible, but do not call an unpaid staging session
-- a paid enrollment failure. Classify missing identity/program information.
create or replace view public.v_paid_not_enrolled with (security_invoker=true) as
select s.session_id,s.email,s.amount,s.program_slug,s.application_id,s.user_id,s.student_id,s.kind,
  s.created_at as paid_at,a.id as app_id_resolved,a.status as app_status,
  case when nullif(trim(s.program_slug),'') is null then 'program_unidentified'
       when coalesce(nullif(s.user_id,''),nullif(s.student_id,''),a.user_id::text) is null then 'learner_unidentified'
       else 'enrollment_unlinked' end as review_category
from public.stripe_sessions_staging s
left join public.applications a on a.id::text=s.application_id
where s.payment_status='paid'
  and not exists (
    select 1 from public.program_enrollments pe
    where pe.stripe_checkout_session_id=s.session_id
       or (s.payment_intent is not null and pe.stripe_payment_intent_id=s.payment_intent)
       or (coalesce(pe.user_id,pe.student_id)::text=coalesce(nullif(s.user_id,''),nullif(s.student_id,''))
           and pe.program_slug=s.program_slug and s.program_slug is not null)
       or (pe.user_id=a.user_id and pe.program_slug=s.program_slug and a.user_id is not null)
  );

-- Absence of Stripe is not absence of payment. Use exact enrollment-linked
-- receipts from every existing payment ledger, never email/name heuristics or
-- subscription status. NOT EXISTS prevents duplicate application rows from
-- hiding valid evidence or counting a learner more than once.
create or replace view public.v_enrolled_not_paid with (security_invoker=true) as
select pe.id as enrollment_id,pe.user_id,pe.student_id,pe.program_slug,pe.enrollment_state,
  pe.funding_source,pe.created_at,pe.stripe_checkout_session_id,pe.stripe_payment_intent_id,
  (select max(af.verification_status) from public.applications a
    join public.application_financials af on af.application_id=a.id
    where (a.user_id=pe.user_id or a.user_id=pe.student_id) and a.program_slug=pe.program_slug
  ) as verification_status
from public.program_enrollments pe
where lower(coalesce(nullif(pe.enrollment_state,''),pe.status)) in ('active','enrolled','approved','in_progress')
  and regexp_replace(lower(trim(pe.funding_source)),'[ -]+','_','g') in ('self_pay','stripe','paypal','affirm','sezzle')
  and not exists (
    select 1 from public.applications a join public.application_financials af on af.application_id=a.id
    where (a.user_id=pe.user_id or a.user_id=pe.student_id) and a.program_slug=pe.program_slug
      and af.verification_status='verified'
  )
  and not exists (
    select 1 from public.stripe_sessions_staging s where s.payment_status='paid' and
      (s.session_id=pe.stripe_checkout_session_id or
       (pe.stripe_payment_intent_id is not null and s.payment_intent=pe.stripe_payment_intent_id))
  )
  and not exists (
    select 1 from public.payments p where p.enrollment_id=pe.id
      and p.status in ('completed','paid','succeeded','captured')
      and coalesce(p.captured_amount_cents,p.amount_cents,p.amount*100)>coalesce(p.refunded_amount_cents,0)
  )
  and not exists (
    select 1 from public.payment_logs pl where
      (pl.enrollment_id=pe.id or pl.metadata->>'program_enrollment_id'=pe.id::text)
      and pl.status in ('completed','paid','succeeded') and pl.amount>0
  )
  and not exists (
    select 1 from public.billing_invoices bi where bi.status='paid' and bi.paid_at is not null
      and bi.total_cents>0 and bi.fulfillment_type in ('tuition_payment','program_enrollment','apprenticeship_deposit')
      and bi.fulfillment_payload->>'enrollment_id'=pe.id::text
  );
