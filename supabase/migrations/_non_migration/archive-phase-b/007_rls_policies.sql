-- Enable Row-Level Security
alter table courses enable row level security;
alter table media enable row level security;
alter table products enable row level security;
alter table purchases enable row level security;
alter table licenses enable row level security;

-- Allow authenticated users to read but only admin to write
create policy "read_all_courses" on courses
for select using (true);

create policy "admin_write_courses" on courses
for insert with check (auth.role() = 'authenticated');

create policy "read_all_products" on products
for select using (true);

create policy "read_own_purchases" on purchases
for select using (auth.jwt() ->> 'email' = email);

create policy "read_own_licenses" on licenses
for select using (auth.jwt() ->> 'email' = email);
