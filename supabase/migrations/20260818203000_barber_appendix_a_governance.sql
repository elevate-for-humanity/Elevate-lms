-- USDOL Appendix A governance for Registered Barber Apprenticeship.
-- Source: lib/compliance/appendix-a-standards.ts / approved registration 2025-IN-132301.
-- This migration intentionally separates competency-based apprenticeship progress
-- from generic school-hour and time-based apprenticeship assumptions.

insert into public.compliance_profiles (
  key,label,credential_target,minimum_program_hours,requires_final_exam,require_passing_scores,
  require_instructor_signoff,require_evidence_for_practicals,require_domain_mapping,
  require_competency_mapping,require_hour_category,require_delivery_method,require_fieldwork_tracking,
  require_instructor_requirements,require_certificate_verification
) values (
  'dol_competency_based','DOL Competency-Based Apprenticeship','DOL_APPRENTICESHIP',0,true,true,true,true,true,true,true,true,true,true,true
)
on conflict (key) do update set
  label=excluded.label,
  credential_target=excluded.credential_target,
  minimum_program_hours=excluded.minimum_program_hours,
  requires_final_exam=excluded.requires_final_exam,
  require_passing_scores=excluded.require_passing_scores,
  require_instructor_signoff=excluded.require_instructor_signoff,
  require_evidence_for_practicals=excluded.require_evidence_for_practicals,
  require_domain_mapping=excluded.require_domain_mapping,
  require_competency_mapping=excluded.require_competency_mapping,
  require_hour_category=excluded.require_hour_category,
  require_delivery_method=excluded.require_delivery_method,
  require_fieldwork_tracking=excluded.require_fieldwork_tracking,
  require_instructor_requirements=excluded.require_instructor_requirements,
  require_certificate_verification=excluded.require_certificate_verification,
  updated_at=now();

alter table public.apprenticeship_programs
  add column if not exists standard_source text,
  add column if not exists standard_registration_number text,
  add column if not exists standard_revision_date date,
  add column if not exists progress_model text,
  add column if not exists competency_count integer,
  add column if not exists related_instruction_hours integer,
  add column if not exists apprentice_to_mentor_ratio text,
  add column if not exists probationary_hours integer,
  add column if not exists rapids_code text,
  add column if not exists wage_milestones jsonb,
  add column if not exists superseded_by uuid,
  add column if not exists archived_at timestamptz;

create table if not exists public.apprenticeship_standard_versions (
  id uuid primary key default gen_random_uuid(),
  standard_key text not null unique,
  program_slug text not null,
  occupation_title text not null,
  onet_soc_code text not null,
  rapids_code text not null,
  sponsor_name text not null,
  registration_number text not null,
  registration_date date,
  revision_date date not null,
  approach text not null check (approach in ('competency_based','time_based','hybrid')),
  competency_count integer not null check (competency_count > 0),
  related_instruction_hours integer not null check (related_instruction_hours > 0),
  apprentice_to_mentor_ratio text not null,
  probationary_hours integer,
  source_authority text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apprenticeship_standard_competencies (
  id uuid primary key default gen_random_uuid(),
  standard_key text not null references public.apprenticeship_standard_versions(standard_key) on delete cascade,
  competency_key text not null,
  source_label text,
  category text not null,
  description text not null,
  display_order integer not null,
  is_required boolean not null default true,
  unique (standard_key, competency_key)
);

create table if not exists public.apprenticeship_rti_requirements (
  id uuid primary key default gen_random_uuid(),
  standard_key text not null references public.apprenticeship_standard_versions(standard_key) on delete cascade,
  title text not null,
  required_hours integer not null check (required_hours > 0),
  display_order integer not null,
  unique (standard_key, display_order)
);

create table if not exists public.apprenticeship_wage_milestones (
  id uuid primary key default gen_random_uuid(),
  standard_key text not null references public.apprenticeship_standard_versions(standard_key) on delete cascade,
  completed_competencies integer not null,
  appendix_hourly_rate numeric(10,2) not null,
  display_order integer not null,
  note text not null default 'Apply the higher of the Appendix A rate or any applicable legal minimum/required wage.',
  unique (standard_key, completed_competencies)
);

create table if not exists public.apprenticeship_program_aliases (
  alias_slug text primary key,
  canonical_slug text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

insert into public.apprenticeship_standard_versions (
  standard_key,program_slug,occupation_title,onet_soc_code,rapids_code,sponsor_name,
  registration_number,registration_date,revision_date,approach,competency_count,
  related_instruction_hours,apprentice_to_mentor_ratio,probationary_hours,source_authority,is_active
) values (
  'barber-0030cb-2025-07-10','barber-apprenticeship','Barber','39-5011.00','0030CB','2 Exclusive LLC-S',
  '2025-IN-132301','2025-01-14','2025-07-10','competency_based',14,260,'1:1',500,
  'U.S. Department of Labor Office of Apprenticeship approved Appendix A Work Process Schedule and Related Instruction Outline',true
)
on conflict (standard_key) do update set
  competency_count=excluded.competency_count,
  related_instruction_hours=excluded.related_instruction_hours,
  apprentice_to_mentor_ratio=excluded.apprentice_to_mentor_ratio,
  probationary_hours=excluded.probationary_hours,
  source_authority=excluded.source_authority,
  is_active=true,
  updated_at=now();

insert into public.apprenticeship_standard_competencies
  (standard_key,competency_key,source_label,category,description,display_order)
values
 ('barber-0030cb-2025-07-10','barber-a','A','Trim client hair','Cut and trim hair according to clients instructions or current hairstyles, using clippers, combs, hand-held blow driers, and scissors.',1),
 ('barber-0030cb-2025-07-10','barber-b','B','Trim client hair','Shape and trim beards and moustaches, using scissors.',2),
 ('barber-0030cb-2025-07-10','barber-c','C','Trim client hair','Apply lather and shave beards or neck and temple hair contours, using razors.',3),
 ('barber-0030cb-2025-07-10','barber-protective-coverings',null,'Apply protective coverings','Apply protective coverings to objects or surfaces near work areas.',4),
 ('barber-0030cb-2025-07-10','barber-d','D','Clean tools or equipment','Clean and sterilize scissors, combs, clippers, and other instruments.',5),
 ('barber-0030cb-2025-07-10','barber-e','E','Discuss service options or needs with clients','Question patrons regarding desired services and haircut styles.',6),
 ('barber-0030cb-2025-07-10','barber-f','F','Clean facilities or work areas','Clean work stations and sweep floors.',7),
 ('barber-0030cb-2025-07-10','barber-g','G','Maintain financial or account records','Record services provided on cashiers tickets or receive payment from customers.',8),
 ('barber-0030cb-2025-07-10','barber-h','H','Perform administrative or clerical tasks','Perform clerical and administrative duties such as keeping records, paying bills, and hiring and supervising personnel.',9),
 ('barber-0030cb-2025-07-10','barber-i','I','Supervise service workers','Perform clerical and administrative duties such as keeping records, paying bills, and hiring and supervising personnel.',10),
 ('barber-0030cb-2025-07-10','barber-j','J','Maintain professional knowledge or certifications','Stay informed of the latest styles and hair care techniques.',11),
 ('barber-0030cb-2025-07-10','barber-k','K','Order materials, supplies, or equipment','Order supplies.',12),
 ('barber-0030cb-2025-07-10','barber-l','L','Promote products, services, or programs','Recommend and sell lotions, tonics, or other cosmetic supplies.',13),
 ('barber-0030cb-2025-07-10','barber-m','M','Maintain client information or service records','Keep card files on clientele, recording notes of work done, products used and fees charged after each visit.',14)
on conflict (standard_key,competency_key) do update set
  source_label=excluded.source_label,category=excluded.category,description=excluded.description,display_order=excluded.display_order;

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

insert into public.apprenticeship_wage_milestones (standard_key,completed_competencies,appendix_hourly_rate,display_order) values
 ('barber-0030cb-2025-07-10',0,8.00,1),
 ('barber-0030cb-2025-07-10',7,9.00,2),
 ('barber-0030cb-2025-07-10',14,9.50,3)
on conflict (standard_key,completed_competencies) do update set appendix_hourly_rate=excluded.appendix_hourly_rate,display_order=excluded.display_order;

with canonical as (
  select id from public.apprenticeship_programs where slug='barber-apprenticeship' order by updated_at desc nulls last limit 1
)
update public.apprenticeship_programs p set
  name='Registered Barber Apprenticeship',required_hours=null,
  vendor_name='Elevate for Humanity Career and Technical Institute',vendor_cost=0,
  occupation_code='39-5011.00',
  description='USDOL Registered Barber Apprenticeship administered by 2 Exclusive LLC-S with Prestige Elevation Barber Curriculum as the related instruction experience. Progress is competency-based under the approved Appendix A.',
  disclaimer='Apprenticeship progress, RTI, competencies, supervision, wages, transfers, and completion are governed by the approved USDOL apprenticeship standards and applicable state licensing law. Funding and licensure are not guaranteed.',
  standard_source='USDOL Appendix A',standard_registration_number='2025-IN-132301',standard_revision_date='2025-07-10',
  progress_model='competency_based',competency_count=14,related_instruction_hours=260,
  apprentice_to_mentor_ratio='1:1',probationary_hours=500,rapids_code='0030CB',
  wage_milestones='[{"completedCompetencies":0,"hourlyRate":8.00},{"completedCompetencies":7,"hourlyRate":9.00},{"completedCompetencies":14,"hourlyRate":9.50}]'::jsonb,
  is_active=true,archived_at=null,superseded_by=null,updated_at=now()
from canonical c where p.id=c.id;

with canonical as (
  select id from public.apprenticeship_programs where slug='barber-apprenticeship' and is_active=true order by updated_at desc nulls last limit 1
)
update public.apprenticeship_programs p set
  is_active=false,superseded_by=c.id,archived_at=coalesce(p.archived_at,now()),
  disclaimer='Legacy Barber program alias retained for historical references. New activity must use barber-apprenticeship.',updated_at=now()
from canonical c where p.slug in ('barber','barber-2024') and p.id<>c.id;

insert into public.apprenticeship_program_aliases(alias_slug,canonical_slug,reason) values
 ('barber','barber-apprenticeship','Legacy program slug consolidated under the USDOL Appendix A canonical program.'),
 ('barber-2024','barber-apprenticeship','Legacy program slug consolidated under the USDOL Appendix A canonical program.')
on conflict(alias_slug) do update set canonical_slug=excluded.canonical_slug,reason=excluded.reason;

update public.courses set
  duration_hours=260,
  governing_body='U.S. Department of Labor Office of Apprenticeship / 2 Exclusive LLC-S',
  governing_region='Registered Apprenticeship 2025-IN-132301',
  governing_standard_version='Appendix A revision 2025-07-10 / RAPIDS 0030CB',
  compliance_profile_key='dol_competency_based',
  audit_notes='Canonical RTI course for the competency-based Barber occupation. Appendix A requires 14 competencies, 260 RTI hours, 1:1 supervision, 500-hour probation, and progressive wage milestones.',
  updated_at=now()
where slug='barber-apprenticeship';

update public.course_lessons l set video_status='complete',video_error=null,video_generated_at=coalesce(video_generated_at,now()),updated_at=now()
where l.course_id=(select id from public.courses where slug='barber-apprenticeship' limit 1)
  and exists (
    select 1 from storage.objects o
    where o.bucket_id='course-videos' and o.name=regexp_replace(l.video_url,'^.*/course-videos/','')
  );

insert into public.course_visual_assets(course_id,placement,media_type,asset_url,alt_text,caption,sort_order,is_active,metadata)
select c.id,'hero','image','/images/barber-hero-new.webp','Prestige Elevation Barber Curriculum','Registered Barber Apprenticeship RTI',1,true,'{"source":"canonical_barber_asset"}'::jsonb
from public.courses c where c.slug='barber-apprenticeship'
and not exists(select 1 from public.course_visual_assets a where a.course_id=c.id and a.placement='hero' and a.is_active);

insert into public.course_visual_assets(course_id,placement,media_type,asset_url,alt_text,caption,sort_order,is_active,metadata)
select c.id,'lesson','image','/images/barber/straight-razor-safety.svg','Straight razor and safety razor handling diagram','Straight razor and safety razor safety',17,true,'{"lesson_slug":"barber-lesson-17","topic":"razor-safety"}'::jsonb
from public.courses c where c.slug='barber-apprenticeship'
and not exists(select 1 from public.course_visual_assets a where a.course_id=c.id and a.placement='lesson' and a.metadata->>'lesson_slug'='barber-lesson-17');

insert into public.course_visual_assets(course_id,placement,media_type,asset_url,alt_text,caption,sort_order,is_active,metadata)
select c.id,'lesson','image','/images/barber/straight-razor-safety.svg','Straight razor shaving technique diagram','Straight razor shaving technique',30,true,'{"lesson_slug":"barber-lesson-30","topic":"straight-razor"}'::jsonb
from public.courses c where c.slug='barber-apprenticeship'
and not exists(select 1 from public.course_visual_assets a where a.course_id=c.id and a.placement='lesson' and a.metadata->>'lesson_slug'='barber-lesson-30');

create or replace view public.barber_appendix_a_course_audit
with (security_invoker=true) as
select c.id course_id,c.slug,c.title,c.duration_hours declared_rti_hours,260::numeric appendix_rti_hours,
  (select count(*) from public.course_modules m where m.course_id=c.id and m.is_published=true) published_modules,
  (select count(*) from public.course_lessons l where l.course_id=c.id and l.is_published=true) published_lessons,
  (select count(*) from public.course_lessons l where l.course_id=c.id and l.video_status='complete') videos_ready,
  (select count(distinct bcm.competency_id) from public.barber_competency_mappings bcm join public.course_lessons l on l.id=bcm.lesson_id where l.course_id=c.id) mapped_appendix_competencies,
  (select count(*) from public.apprenticeship_standard_competencies sc where sc.standard_key='barber-0030cb-2025-07-10' and sc.is_required=true) required_appendix_competencies,
  c.governing_standard_version
from public.courses c where c.slug='barber-apprenticeship';
