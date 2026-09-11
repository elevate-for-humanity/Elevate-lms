-- Universal, auditable practical-skill evidence and authorized review.
create table if not exists public.course_practical_submissions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  interaction_id text not null check (length(interaction_id) between 1 and 240),
  competency_keys text[] not null default '{}',
  evidence jsonb not null default '[]'::jsonb,
  learner_attestation boolean not null default false,
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'approved', 'revision_required', 'rejected')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, lesson_id, interaction_id)
);

create table if not exists public.course_practical_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.course_practical_submissions(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approved', 'revision_required', 'rejected')),
  competency_results jsonb not null default '{}'::jsonb,
  comments text not null,
  reviewed_at timestamptz not null default now()
);

create table if not exists public.learning_action_events (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.course_lessons(id) on delete cascade,
  action text not null check (action in ('record_mastery', 'unlock_next', 'assign_remediation', 'request_expert_review')),
  source_type text not null,
  source_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.course_practical_submissions enable row level security;
alter table public.course_practical_reviews enable row level security;
alter table public.learning_action_events enable row level security;

create policy "learners read own practical submissions"
on public.course_practical_submissions for select to authenticated
using (learner_id = (select auth.uid()));

create policy "learners create own practical submissions"
on public.course_practical_submissions for insert to authenticated
with check (learner_id = (select auth.uid()) and status = 'submitted');

create policy "learners resubmit own practical submissions"
on public.course_practical_submissions for update to authenticated
using (learner_id = (select auth.uid()) and status in ('submitted', 'revision_required'))
with check (learner_id = (select auth.uid()) and status = 'submitted');

create policy "authorized reviewers read practical submissions"
on public.course_practical_submissions for select to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','super_admin','org_admin','instructor','staff')));

create policy "authorized reviewers create reviews"
on public.course_practical_reviews for insert to authenticated
with check (reviewer_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','super_admin','org_admin','instructor','staff')));

create policy "participants read practical reviews"
on public.course_practical_reviews for select to authenticated
using (reviewer_id = (select auth.uid()) or exists (select 1 from public.course_practical_submissions s where s.id = submission_id and s.learner_id = (select auth.uid())));

create policy "learners read own learning actions"
on public.learning_action_events for select to authenticated
using (learner_id = (select auth.uid()));

create index if not exists course_practical_review_queue_idx
  on public.course_practical_submissions (status, submitted_at);
create index if not exists course_practical_learner_lesson_idx
  on public.course_practical_submissions (learner_id, lesson_id);
create index if not exists course_practical_reviews_submission_idx
  on public.course_practical_reviews (submission_id, reviewed_at desc);
create index if not exists course_practical_reviews_reviewer_idx
  on public.course_practical_reviews (reviewer_id, reviewed_at desc);
create index if not exists learning_action_learner_course_idx
  on public.learning_action_events (learner_id, course_id, created_at desc);
