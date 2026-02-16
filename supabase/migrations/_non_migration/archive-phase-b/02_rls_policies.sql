-- 02_rls_policies.sql
-- Enable RLS and add basic policies. Adjust/admin as needed.

----------------------------------------------------------------
-- PROGRAMS (public read, admin/service write)
----------------------------------------------------------------
alter table programs enable row level security;

-- Anyone (even not logged in) can read active programs for marketing/catalog
create policy "Public read active programs"
  on programs
  for select
  using (is_active = true);

-- Only service role or future admin role should insert/update/delete (handled via backend key)
-- You can skip explicit RLS for service role since it bypasses RLS by design.

----------------------------------------------------------------
-- MODULES
----------------------------------------------------------------
alter table modules enable row level security;

-- Public read to show curriculum outline
create policy "Public read modules"
  on modules
  for select
  using (true);

----------------------------------------------------------------
-- LESSONS
----------------------------------------------------------------
alter table lessons enable row level security;

-- Logged-in learners can read lessons (or you can keep it public if you want teaser access)
create policy "Learners read lessons"
  on lessons
  for select
  using (true);

----------------------------------------------------------------
-- ENROLLMENTS
----------------------------------------------------------------
alter table enrollments enable row level security;

-- Learners can read their own enrollments
create policy "Learners select own enrollments"
  on enrollments
  for select
  using (auth.uid() = user_id);

-- Optionally allow learners to insert their own enrollment (if you support self-enroll)
-- Otherwise, rely on backend service role to insert.
-- create policy "Learners insert own enrollments"
--   on enrollments
--   for insert
--   with check (auth.uid() = user_id);

----------------------------------------------------------------
-- LESSON PROGRESS
----------------------------------------------------------------
alter table lesson_progress enable row level security;

-- Learners can see their own progress
create policy "Learners select own progress"
  on lesson_progress
  for select
  using (
    exists (
      select 1 from enrollments e
      where e.id = lesson_progress.enrollment_id
      and e.user_id = auth.uid()
    )
  );

-- Learners can update their own progress
create policy "Learners update own progress"
  on lesson_progress
  for update
  using (
    exists (
      select 1 from enrollments e
      where e.id = lesson_progress.enrollment_id
      and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from enrollments e
      where e.id = lesson_progress.enrollment_id
      and e.user_id = auth.uid()
    )
  );

----------------------------------------------------------------
-- CERTIFICATES
----------------------------------------------------------------
alter table certificates enable row level security;

-- Learners can see their own certificates
create policy "Learners select own certificates"
  on certificates
  for select
  using (auth.uid() = user_id);

----------------------------------------------------------------
-- APPLICATIONS (only backend/admin)
----------------------------------------------------------------
alter table applications enable row level security;

-- No direct client-side access except maybe for the logged in user's own record (optional).
-- In most cases, you'll use the service role in API routes to insert and read applications.

-- Example: allow logged in user to see their own applications if you want:
-- create policy "Learners see their applications"
--   on applications
--   for select
--   using (email = auth.jwt()->>'email');

----------------------------------------------------------------
-- CONTACT MESSAGES (backend/admin only)
----------------------------------------------------------------
alter table contact_messages enable row level security;

-- Usually you only insert via anon key and read via service role/admin.
-- So you can start with no public select policies.
