-- Elevate LMS Feature Pack Migration
-- Created: 2025-11-06
-- Description: AI Coach, Community, Live Classes, Credentials, Scholarships, Employer Pipeline, Compliance

-- PROFILES & ROLES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text check (role in ('student','instructor','employer','admin')) default 'student',
  created_at timestamptz default now()
);

-- COURSES & SESSIONS (live classes)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  price_cents int default 0,
  is_bundle boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  zoom_join_url text,
  zoom_recording_url text,
  scheduler_event_id text,
  created_at timestamptz default now()
);

-- ENROLLMENTS
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  status text check (status in ('active','completed','refunded')) default 'active',
  created_at timestamptz default now(),
  unique(user_id, course_id)
);

-- Q-BANK
create table if not exists public.qbank_questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  stem text not null,
  choices jsonb not null,
  rationale text,
  topic text,
  difficulty int check (difficulty between 1 and 5) default 3,
  created_at timestamptz default now()
);

create table if not exists public.qbank_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  answers jsonb not null,
  score_percent numeric,
  duration_sec int,
  created_at timestamptz default now()
);

-- AI COACH: mastery & study plan
create table if not exists public.coach_mastery (
  user_id uuid references auth.users(id) on delete cascade,
  topic text,
  mastery numeric check (mastery between 0 and 1) default 0,
  primary key (user_id, topic)
);

create table if not exists public.coach_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  plan jsonb not null,
  generated_at timestamptz default now()
);

-- COMMUNITY FEED
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- CREDENTIALS / BADGES
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  description text,
  criteria jsonb not null
);

create table if not exists public.user_badges (
  user_id uuid references auth.users(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  awarded_at timestamptz default now(),
  primary key (user_id, badge_id)
);

-- SCHOLARSHIPS
create table if not exists public.scholarships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fund_cents int not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.scholarship_awards (
  id uuid primary key default gen_random_uuid(),
  scholarship_id uuid references public.scholarships(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  amount_cents int not null,
  awarded_at timestamptz default now()
);

-- EMPLOYER PIPELINE
create table if not exists public.employers (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  contact_email text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.candidate_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  headline text,
  skills text[],
  location text,
  available_from date,
  resume_url text,
  visibility text check (visibility in ('private','employers','public')) default 'employers'
);

-- COMPLIANCE SNAPSHOTS
create table if not exists public.compliance_snapshots (
  id uuid primary key default gen_random_uuid(),
  label text,
  payload jsonb not null,
  generated_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.enrollments enable row level security;
alter table public.qbank_attempts enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.coach_mastery enable row level security;
alter table public.coach_plans enable row level security;
alter table public.candidate_profiles enable row level security;

-- RLS POLICIES
create policy "own_profile" on public.profiles for select using (auth.uid() = id);
create policy "own_profile_upd" on public.profiles for update using (auth.uid() = id);

create policy "own_attempts" on public.qbank_attempts for select using (auth.uid() = user_id);
create policy "insert_attempts" on public.qbank_attempts for insert with check (auth.uid() = user_id);

create policy "read_posts" on public.community_posts for select using (true);
create policy "write_posts" on public.community_posts for insert with check (auth.uid() = user_id);

create policy "read_comments" on public.community_comments for select using (true);
create policy "write_comments" on public.community_comments for insert with check (auth.uid() = user_id);

create policy "own_mastery" on public.coach_mastery for select using (auth.uid() = user_id);
create policy "own_mastery_upd" on public.coach_mastery for update using (auth.uid() = user_id);

create policy "own_plans" on public.coach_plans for select using (auth.uid() = user_id);
create policy "own_plans_ins" on public.coach_plans for insert with check (auth.uid() = user_id);

create policy "own_candidate_profile" on public.candidate_profiles for select using (auth.uid() = user_id);
create policy "own_candidate_profile_upd" on public.candidate_profiles for update using (auth.uid() = user_id);

-- HELPER FUNCTIONS
create or replace function public.ensure_enrollment(p_user_email text, p_course_id uuid, p_session_id uuid)
returns void language plpgsql as $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = p_user_email;
  if v_user_id is null then return; end if;
  insert into public.enrollments(user_id, course_id, session_id)
  values (v_user_id, p_course_id, p_session_id)
  on conflict (user_id, course_id) do update set session_id = excluded.session_id;
end;
$$;

create or replace function public.pick_scholarship_candidates(p_limit int)
returns table(user_id uuid) language sql as $$
  select a.user_id
  from qbank_attempts a
  group by a.user_id
  order by avg(a.score_percent) desc nulls last
  limit p_limit;
$$;

create or replace function public.metric_enrollments(p_range text) returns json language sql as $$
  select json_agg(row_to_json(t)) from (
    select date_trunc('week', created_at) as week, count(*) as enrollments
    from enrollments
    where created_at > now() - interval '90 days'
    group by 1 order by 1
  ) t;
$$;

create or replace function public.metric_outcomes(p_range text) returns json language sql as $$
  select json_build_object(
    'avg_score', (select avg(score_percent) from qbank_attempts where created_at > now() - interval '90 days'),
    'completion_rate', (
      select coalesce(avg(case when status='completed' then 1 else 0 end),0)
      from enrollments where created_at > now() - interval '90 days'
    )
  );
$$;
