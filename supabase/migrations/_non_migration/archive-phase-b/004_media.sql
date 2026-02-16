create table if not exists media (
  id uuid primary key default uuid_generate_v4(),
  path text not null,
  uploaded_by uuid,
  created_at timestamp default now()
);
