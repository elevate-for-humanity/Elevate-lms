-- Canonical platform relationship hardening.
-- Add missing high-confidence foreign keys used across Admin, LMS, dashboards,
-- career services, apprenticeship, and program-holder flows.
-- Existing legacy orphans are preserved only where explicitly marked NOT VALID;
-- new writes are still constrained by those relationships.

do $$
begin
  if not exists (select 1 from pg_constraint where conname='apprentices_host_shop_id_fkey') then
    alter table public.apprentices
      add constraint apprentices_host_shop_id_fkey
      foreign key (host_shop_id) references public.host_shops(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='apprentices_enrollment_id_fkey') then
    alter table public.apprentices
      add constraint apprentices_enrollment_id_fkey
      foreign key (enrollment_id) references public.program_enrollments(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='apprentices_barber_subscription_id_fkey') then
    alter table public.apprentices
      add constraint apprentices_barber_subscription_id_fkey
      foreign key (barber_subscription_id) references public.barber_subscriptions(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='apprentices_program_id_fkey') then
    alter table public.apprentices
      add constraint apprentices_program_id_fkey
      foreign key (program_id) references public.programs(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='host_shops_owner_id_fkey') then
    alter table public.host_shops
      add constraint host_shops_owner_id_fkey
      foreign key (owner_id) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='host_shops_tenant_id_fkey') then
    alter table public.host_shops
      add constraint host_shops_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname='job_applications_job_posting_id_fkey') then
    alter table public.job_applications
      add constraint job_applications_job_posting_id_fkey
      foreign key (job_posting_id) references public.job_postings(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='job_applications_user_id_fkey') then
    alter table public.job_applications
      add constraint job_applications_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname='job_placements_employer_id_fkey') then
    alter table public.job_placements
      add constraint job_placements_employer_id_fkey
      foreign key (employer_id) references public.employers(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='job_placements_user_id_fkey') then
    alter table public.job_placements
      add constraint job_placements_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname='job_postings_employer_id_fkey') then
    alter table public.job_postings
      add constraint job_postings_employer_id_fkey
      foreign key (employer_id) references public.employers(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='job_postings_posted_by_fkey') then
    alter table public.job_postings
      add constraint job_postings_posted_by_fkey
      foreign key (posted_by) references auth.users(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname='notifications_course_id_fkey') then
    alter table public.notifications
      add constraint notifications_course_id_fkey
      foreign key (course_id) references public.courses(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname='program_enrollments_host_shop_id_fkey') then
    alter table public.program_enrollments
      add constraint program_enrollments_host_shop_id_fkey
      foreign key (host_shop_id) references public.host_shops(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='program_enrollments_program_holder_id_fkey') then
    alter table public.program_enrollments
      add constraint program_enrollments_program_holder_id_fkey
      foreign key (program_holder_id) references public.program_holders(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='program_enrollments_funding_program_id_fkey') then
    alter table public.program_enrollments
      add constraint program_enrollments_funding_program_id_fkey
      foreign key (funding_program_id) references public.funding_programs(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='program_enrollments_organization_id_fkey') then
    alter table public.program_enrollments
      add constraint program_enrollments_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname='programs_org_id_fkey') then
    alter table public.programs
      add constraint programs_org_id_fkey
      foreign key (org_id) references public.organizations(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='programs_tenant_id_fkey') then
    alter table public.programs
      add constraint programs_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='programs_partner_id_fkey') then
    alter table public.programs
      add constraint programs_partner_id_fkey
      foreign key (partner_id) references public.partners(id) on delete set null not valid;
  end if;
end
$$;
