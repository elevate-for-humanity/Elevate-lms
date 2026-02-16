create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  price int not null,
  repo text not null,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamp default now()
);
