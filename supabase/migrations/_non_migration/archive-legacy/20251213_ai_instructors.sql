-- =========================================================
-- AI INSTRUCTORS: tables + policies (student-safe)
-- =========================================================

-- 1) AI instructors catalog (program-specific)
create table if not exists public.ai_instructors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  role_title text not null,
  program_slug text not null, -- e.g. 'barber-apprenticeship'
  instructor_type text not null default 'ai', -- 'ai' only for now
  system_prompt text not null,
  capabilities jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_instructors_program_slug_idx
on public.ai_instructors(program_slug);

-- 2) Assignment of AI instructor to student
create table if not exists public.ai_instructor_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  instructor_id uuid not null references public.ai_instructors(id) on delete cascade,
  program_slug text not null,
  status text not null default 'active', -- active/inactive
  assigned_at timestamptz not null default now(),
  unique (student_id, instructor_id)
);

create index if not exists ai_instructor_assignments_student_idx
on public.ai_instructor_assignments(student_id);

create index if not exists ai_instructor_assignments_program_idx
on public.ai_instructor_assignments(program_slug);

-- 3) Conversations (one per student + instructor + program)
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  instructor_id uuid not null references public.ai_instructors(id) on delete cascade,
  program_slug text not null,
  title text null,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_conversations_student_idx
on public.ai_conversations(student_id);

-- 4) Messages (audit-friendly)
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  instructor_id uuid not null references public.ai_instructors(id) on delete cascade,
  role text not null check (role in ('student','assistant','system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_conversation_idx
on public.ai_messages(conversation_id);

-- 5) Simple audit log (optional but recommended)
create table if not exists public.ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid null,
  program_slug text null,
  action text not null, -- e.g. 'ASSIGN_INSTRUCTOR', 'CHAT_MESSAGE', 'AUTO_ENROLL'
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- RLS
-- =========================================================
alter table public.ai_instructors enable row level security;
alter table public.ai_instructor_assignments enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_audit_log enable row level security;

-- AI instructors: readable by authenticated users (only active)
drop policy if exists "ai_instructors_read_active" on public.ai_instructors;
create policy "ai_instructors_read_active"
on public.ai_instructors
for select
to authenticated
using (is_active = true);

-- Assignments: student can read their own
drop policy if exists "ai_assignments_read_own" on public.ai_instructor_assignments;
create policy "ai_assignments_read_own"
on public.ai_instructor_assignments
for select
to authenticated
using (student_id = auth.uid());

-- Conversations: student can read their own
drop policy if exists "ai_conversations_read_own" on public.ai_conversations;
create policy "ai_conversations_read_own"
on public.ai_conversations
for select
to authenticated
using (student_id = auth.uid());

-- Messages: student can read their own conversation messages
drop policy if exists "ai_messages_read_own" on public.ai_messages;
create policy "ai_messages_read_own"
on public.ai_messages
for select
to authenticated
using (student_id = auth.uid());

-- Messages: student can insert ONLY their own student messages
drop policy if exists "ai_messages_insert_student_own" on public.ai_messages;
create policy "ai_messages_insert_student_own"
on public.ai_messages
for insert
to authenticated
with check (
  student_id = auth.uid()
  and role = 'student'
);

-- Audit log: student can read only their own entries (optional)
drop policy if exists "ai_audit_read_own" on public.ai_audit_log;
create policy "ai_audit_read_own"
on public.ai_audit_log
for select
to authenticated
using (student_id = auth.uid());

-- =========================================================
-- Seed: Barber AI Instructor (you can add more later)
-- =========================================================
insert into public.ai_instructors
(slug, name, role_title, program_slug, system_prompt, capabilities, is_active)
values
(
  'efh-barber-ai',
  'EFH Barber Program Instructor',
  'Barber Program Instructor (AI)',
  'barber-apprenticeship',
  'You are the EFH Barber Program AI Instructor for Elevate for Humanity.

You support students enrolled in the Barber Apprenticeship program.

Instructional structure:
• Core coursework is delivered through Milady RISE.
• You do NOT replace Milady content.
• You help students navigate Milady, understand requirements, and stay on track.

Your responsibilities:
• Guide onboarding and expectations
• Explain how Milady coursework works
• Answer questions about licensure pathways (general info only)
• Clarify apprenticeship structure and earn-while-you-learn expectations
• Direct students to required courses and completion steps
• Reinforce professionalism, attendance, and compliance
• Escalate complex issues to EFH staff when needed

Boundaries:
• Do NOT provide legal advice
• Do NOT contradict Milady content
• Do NOT issue certifications

Tone:
• Professional, supportive, clear, empowering.',
  jsonb_build_object(
    'onboarding', true,
    'milady_guidance', true,
    'policy_questions', true,
    'career_guidance', true
  ),
  true
)
on conflict (slug) do update set
  name = excluded.name,
  role_title = excluded.role_title,
  program_slug = excluded.program_slug,
  system_prompt = excluded.system_prompt,
  capabilities = excluded.capabilities,
  is_active = excluded.is_active,
  updated_at = now();
