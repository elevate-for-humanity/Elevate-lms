-- Applications table for intake tracking
create table if not exists applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  email text not null,
  phone text not null,
  program text not null,
  funding text not null,
  eligible boolean,
  notes text
);

alter table applications enable row level security;

create policy "service insert"
on applications
for insert
using (true);

create index if not exists idx_applications_created_at on applications(created_at desc);
create index if not exists idx_applications_email on applications(email);
create index if not exists idx_applications_eligible on applications(eligible);

grant insert on applications to anon, authenticated;
grant all on applications to service_role;
