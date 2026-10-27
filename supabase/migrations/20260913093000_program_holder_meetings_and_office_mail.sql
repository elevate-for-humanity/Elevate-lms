create table if not exists public.program_holder_meetings (
  id uuid primary key default gen_random_uuid(),
  program_holder_id uuid not null references public.program_holders(id) on delete cascade,
  program_holder_student_id uuid references public.program_holder_students(id) on delete set null,
  enrollment_id uuid references public.program_enrollments(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes between 10 and 240),
  meeting_method text not null check (meeting_method in ('phone','video','in_person')),
  meeting_url text,
  location text,
  agenda text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.program_holder_office_messages (
  id uuid primary key default gen_random_uuid(),
  program_holder_id uuid not null references public.program_holders(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  recipient_id uuid not null references auth.users(id),
  subject text not null,
  body text not null,
  reply_to_id uuid references public.program_holder_office_messages(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists program_holder_meetings_holder_start
  on public.program_holder_meetings(program_holder_id, starts_at);
create index if not exists program_holder_office_messages_recipient
  on public.program_holder_office_messages(recipient_id, read_at, created_at desc);

alter table public.program_holder_meetings enable row level security;
alter table public.program_holder_office_messages enable row level security;

create policy program_holder_meetings_own on public.program_holder_meetings
  for all to authenticated using (program_holder_id = public.current_program_holder_id())
  with check (program_holder_id = public.current_program_holder_id() and created_by = auth.uid());
create policy program_holder_office_messages_participant on public.program_holder_office_messages
  for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy program_holder_office_messages_send on public.program_holder_office_messages
  for insert to authenticated with check (sender_id = auth.uid());
create policy program_holder_office_messages_recipient_update on public.program_holder_office_messages
  for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

grant select, insert, update on public.program_holder_meetings to authenticated;
grant select, insert, update on public.program_holder_office_messages to authenticated;
grant all on public.program_holder_meetings to service_role;
grant all on public.program_holder_office_messages to service_role;
