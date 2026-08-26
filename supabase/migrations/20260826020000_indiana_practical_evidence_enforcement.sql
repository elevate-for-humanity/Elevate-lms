-- Indiana practical-performance evidence layered onto the immutable USDOL Appendix A records.
-- Effective rules: 820 IAC changes published 2026-07-22.
-- Existing historical records are preserved. New or updated practical sign-offs fail closed.

alter table public.apprentice_competency_records
  add column if not exists requires_practical_evidence boolean not null default false,
  add column if not exists performance_subject text
    check (performance_subject in ('student','patron','mannequin')),
  add column if not exists evidence_type text
    check (evidence_type in ('photo','video','checklist','observation','document')),
  add column if not exists evidence_url text,
  add column if not exists practical_performed_at date,
  add column if not exists evidence_review_status text not null default 'not_required'
    check (evidence_review_status in ('not_required','submitted','approved','rejected')),
  add column if not exists verified_by_license_number text,
  add column if not exists state_authority text,
  add column if not exists state_standard_version text,
  add column if not exists state_requirement_citation text,
  add column if not exists evidence_verified_at timestamptz;

create or replace function public.enforce_apprenticeship_practical_evidence()
returns trigger language plpgsql as $$
begin
  if new.completed and new.requires_practical_evidence then
    if new.performance_subject is null
      or nullif(trim(coalesce(new.evidence_url,'')), '') is null
      or new.practical_performed_at is null
      or nullif(trim(coalesce(new.verified_by_license_number,'')), '') is null
      or new.verified_by is null
      or new.evidence_review_status <> 'approved'
    then
      raise exception 'PRACTICAL_EVIDENCE_REQUIRED: subject, evidence, performance date, licensed verifier, and approval are required';
    end if;
    new.evidence_verified_at := coalesce(new.evidence_verified_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_apprenticeship_practical_evidence
  on public.apprentice_competency_records;
create trigger trg_enforce_apprenticeship_practical_evidence
before insert or update on public.apprentice_competency_records
for each row execute function public.enforce_apprenticeship_practical_evidence();

create index if not exists idx_apprentice_competency_evidence_review
  on public.apprentice_competency_records(enrollment_id,evidence_review_status)
  where requires_practical_evidence=true;

comment on column public.apprentice_competency_records.performance_subject is
  'Indiana progress-report subject: student, patron/customer, or mannequin.';
comment on column public.apprentice_competency_records.verified_by_license_number is
  'License number supplied by the licensed instructor/authorized verifier; never inferred.';
