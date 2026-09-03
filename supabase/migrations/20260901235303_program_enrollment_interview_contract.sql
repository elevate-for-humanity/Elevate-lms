alter table public.program_enrollments
  add column if not exists eligibility_status text,
  add column if not exists risk_level text,
  add column if not exists interview_score numeric,
  add column if not exists interview_session_id uuid;

notify pgrst, 'reload schema';
