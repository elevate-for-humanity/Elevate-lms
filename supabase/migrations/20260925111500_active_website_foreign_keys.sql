-- Extend canonical foreign-key coverage across active website flows.

do $$
begin
  if not exists (select 1 from pg_constraint where conname='courses_created_by_fkey') then
    alter table public.courses
      add constraint courses_created_by_fkey
      foreign key (created_by) references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='course_modules_created_by_fkey') then
    alter table public.course_modules
      add constraint course_modules_created_by_fkey
      foreign key (created_by) references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='program_holders_approved_by_fkey') then
    alter table public.program_holders
      add constraint program_holders_approved_by_fkey
      foreign key (approved_by) references auth.users(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname='messages_conversation_id_fkey') then
    alter table public.messages
      add constraint messages_conversation_id_fkey
      foreign key (conversation_id) references public.conversations(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='messages_thread_id_fkey') then
    alter table public.messages
      add constraint messages_thread_id_fkey
      foreign key (thread_id) references public.message_threads(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='messages_parent_id_fkey') then
    alter table public.messages
      add constraint messages_parent_id_fkey
      foreign key (parent_id) references public.messages(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname='payments_course_id_fkey') then
    alter table public.payments
      add constraint payments_course_id_fkey
      foreign key (course_id) references public.courses(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='payments_enrollment_id_fkey') then
    alter table public.payments
      add constraint payments_enrollment_id_fkey
      foreign key (enrollment_id) references public.program_enrollments(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='payments_application_id_fkey') then
    alter table public.payments
      add constraint payments_application_id_fkey
      foreign key (application_id) references public.applications(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='payment_transactions_enrollment_id_fkey') then
    alter table public.payment_transactions
      add constraint payment_transactions_enrollment_id_fkey
      foreign key (enrollment_id) references public.program_enrollments(id) on delete set null;
  end if;
end
$$;
