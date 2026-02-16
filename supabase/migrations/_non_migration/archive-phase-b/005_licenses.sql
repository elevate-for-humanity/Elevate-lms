create table if not exists licenses (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  product_id uuid references products(id),
  license_key text unique not null,
  created_at timestamp default now()
);

create index if not exists idx_licenses_email on licenses(email);
