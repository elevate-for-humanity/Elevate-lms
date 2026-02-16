create table if not exists purchases (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  product_id uuid references products(id),
  repo text,
  created_at timestamp default now()
);

create index if not exists idx_purchases_email on purchases(email);
