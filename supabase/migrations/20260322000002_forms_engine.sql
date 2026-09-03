-- Forms engine: database-driven forms, fields, and submissions

create table if not exists forms (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists form_fields (
  id         uuid primary key default gen_random_uuid(),
  form_id    uuid not null references forms(id) on delete cascade,
  name       text not null,
  label      text not null,
  type       text not null default 'text',  -- text|email|tel|number|select|textarea|checkbox
  required   boolean not null default false,
  options    jsonb not null default '[]',   -- for select fields: [{"label":"..","value":".."}]
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_form_fields_form on form_fields(form_id, position);

create table if not exists form_submissions (
  id         uuid primary key default gen_random_uuid(),
  form_id    uuid not null references forms(id),
  payload    jsonb not null default '{}',
  user_id    uuid references auth.users(id),  -- null for anonymous submissions
  created_at timestamptz not null default now()
);

create index if not exists idx_form_submissions_form on form_submissions(form_id, created_at desc);

create trigger forms_updated_at
  before update on forms
  for each row execute function touch_updated_at();

-- RLS
alter table forms enable row level security;
alter table form_fields enable row level security;
alter table form_submissions enable row level security;

-- Anyone can read published forms and their fields
create policy "forms_public_read"
  on forms for select using (true);

create policy "form_fields_public_read"
  on form_fields for select using (true);

-- Anyone can submit (anonymous intake forms, etc.)
create policy "form_submissions_insert"
  on form_submissions for insert with check (true);

-- Only admin can read submissions and manage forms
create policy "forms_admin_all"
  on forms for all using (is_admin_role());

create policy "form_fields_admin_all"
  on form_fields for all using (is_admin_role());

create policy "form_submissions_admin_read"
  on form_submissions for select using (is_admin_role());
