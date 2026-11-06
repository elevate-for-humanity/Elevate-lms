-- Reconcile the checked-in schema contract with the already-present production
-- evidence table. Does not update or approve any apprentice evidence records.
-- Verified against production on 2026-11-06.
create table if not exists public.apprentice_licensing_evidence (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  enrollment_id uuid,
  occupation_code text not null,
  requirement_key text not null
    check (requirement_key = any (array[
      'approved_standard','rapids_registration','signed_agreement',
      'identity_eligibility','name_change','disclosure_documents',
      'employer_mentor','ojt_verified','rti_verified','competencies_verified',
      'rti_provider','wage_progression','transfer_credit','final_practical',
      'official_completion','psi_eligibility','written_exam_pass',
      'state_application','state_fee','license_issued','pla_route_confirmation'
    ])),
  status text not null default 'missing'
    check (status = any (array['missing','pending_review','verified','rejected','not_applicable'])),
  evidence_reference text,
  verified_by uuid,
  verified_at timestamptz,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id,occupation_code,requirement_key),
  constraint licensing_verified_requires_reviewer
    check (status <> 'verified' or
      (verified_by is not null and verified_at is not null and evidence_reference is not null))
);
alter table public.apprentice_licensing_evidence enable row level security;
-- No anon/authenticated policies: access stays through the authorized admin backend.
