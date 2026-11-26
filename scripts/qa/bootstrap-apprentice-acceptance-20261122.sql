-- QA-only browser dependencies from the canonical attendance, wage, certificate
-- and Barber Appendix A contracts. Apply after the apprentice runtime stage.
BEGIN;
SET LOCAL search_path = public, pg_catalog;

DO $qa$
BEGIN
  IF to_regclass('private.qa_environment_identity') IS NULL THEN
    RAISE EXCEPTION 'Apprentice acceptance stage requires the isolated QA identity';
  END IF;
  IF (SELECT array_agg(project_ref) FROM private.qa_environment_identity)
       IS DISTINCT FROM ARRAY['isdgjcdabhxxozarmxta']::text[] THEN
    RAISE EXCEPTION 'Apprentice acceptance stage refused outside isolated QA';
  END IF;
END;
$qa$;


-- Preserve the ownership policy and the existing private storage bucket.
DO $qa$
BEGIN
  UPDATE storage.buckets
  SET allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'],
      file_size_limit = greatest(file_size_limit, 20 * 1024 * 1024)
  WHERE id = 'documents' AND NOT public;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Apprentice acceptance requires the private documents bucket';
  END IF;
END;
$qa$;

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS assigned_shop_id uuid;

-- Canonical host-shop attendance ledger.
-- Direct client access is intentionally blocked by RLS; writes must pass through
-- the authenticated host-shop API, which validates active partner/shop placement.

create table if not exists public.host_shop_attendance_records (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  tenant_id uuid not null,
  placement_id uuid not null references public.apprentice_placements(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present', 'absent', 'excused', 'late')),
  notes text,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (placement_id, attendance_date)
);

create index if not exists idx_host_shop_attendance_partner_date
  on public.host_shop_attendance_records(partner_id, attendance_date desc);

create index if not exists idx_host_shop_attendance_shop_date
  on public.host_shop_attendance_records(shop_id, attendance_date desc);

create index if not exists idx_host_shop_attendance_student_date
  on public.host_shop_attendance_records(student_id, attendance_date desc);

alter table public.host_shop_attendance_records enable row level security;

comment on table public.host_shop_attendance_records is
  'Host-shop attendance records validated against active apprentice placements. Service-role API access only unless explicit RLS policies are added.';

create table if not exists public.apprenticeship_wage_obligations (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  placement_id uuid references public.apprentice_placements(id) on delete set null,
  standard_key text not null references public.apprenticeship_standard_versions(standard_key),
  completed_competencies integer not null,
  appendix_hourly_rate numeric(10,2) not null,
  legal_minimum_override numeric(10,2),
  employer_registered_rate numeric(10,2),
  required_hourly_rate numeric(10,2) generated always as (
    greatest(
      appendix_hourly_rate,
      coalesce(employer_registered_rate, appendix_hourly_rate),
      coalesce(legal_minimum_override, appendix_hourly_rate)
    )
  ) stored,
  triggered_at timestamptz not null default now(),
  effective_date date,
  status text not null default 'pending' check (status in ('pending','acknowledged','verified','superseded')),
  verified_wage numeric(10,2),
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  evidence_notes text,
  unique(enrollment_id,standard_key,completed_competencies)
);

ALTER TABLE public.apprenticeship_wage_obligations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.host_shop_attendance_records, public.apprenticeship_wage_obligations
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.host_shop_attendance_records, public.apprenticeship_wage_obligations
  TO service_role;

insert into public.apprenticeship_rti_requirements (standard_key,title,required_hours,display_order) values
 ('barber-0030cb-2025-07-10','Barbering History and Professional Development',10,1),
 ('barber-0030cb-2025-07-10','Anatomy, Physiology & Skin/Nail Disorders',60,2),
 ('barber-0030cb-2025-07-10','Hair & Scalp Theory, Disorders, and Treatments',60,3),
 ('barber-0030cb-2025-07-10','Infection Control & Bloodborne Pathogens (OSHA)',40,4),
 ('barber-0030cb-2025-07-10','Hair Cutting Theory, Tool Safety, and Techniques',60,5),
 ('barber-0030cb-2025-07-10','State Board Laws, Rules, and Regulations',10,6),
 ('barber-0030cb-2025-07-10','Business Practices',10,7),
 ('barber-0030cb-2025-07-10','Preparation for State Licensing Examination',10,8)
on conflict (standard_key,display_order) do update set title=excluded.title,required_hours=excluded.required_hours;

NOTIFY pgrst, 'reload schema';
COMMIT;
