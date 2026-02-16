create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  metadata jsonb,
  created_at timestamp default now()
);

create index if not exists idx_courses_slug on courses(slug);
