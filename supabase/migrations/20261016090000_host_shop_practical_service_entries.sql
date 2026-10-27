create table if not exists public.host_shop_practical_service_entries (
 id uuid primary key default gen_random_uuid(),
 enrollment_id uuid not null references public.program_enrollments(id),
 placement_id uuid not null references public.apprentice_placements(id),
 shop_id uuid not null,
 student_id uuid not null,
 competency_id text not null,
 service_name text not null,
 performed_on date not null,
 subject_type text not null check (subject_type in ('patron','mannequin','student')),
 mentor_user_id uuid not null,
 mentor_notes text,
 verified_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 voided_at timestamptz,
 void_reason text
);
create index if not exists idx_host_practical_enrollment on public.host_shop_practical_service_entries(enrollment_id,performed_on);
alter table public.host_shop_practical_service_entries enable row level security;
-- Read/write through authenticated, role-scoped server routes only.
revoke all on public.host_shop_practical_service_entries from anon, authenticated;
