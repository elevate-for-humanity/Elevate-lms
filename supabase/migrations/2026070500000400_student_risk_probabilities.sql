-- Add placement_probability and completion_probability columns to student_risk_status.
-- Populated by the at-risk-detection internal endpoint after AI scoring.

alter table public.student_risk_status
  add column if not exists placement_probability   numeric(5,4) check (placement_probability between 0 and 1),
  add column if not exists completion_probability  numeric(5,4) check (completion_probability between 0 and 1),
  add column if not exists probabilities_updated_at timestamptz;

comment on column public.student_risk_status.placement_probability  is 'AI-estimated probability (0–1) that the student will achieve job placement.';
comment on column public.student_risk_status.completion_probability is 'AI-estimated probability (0–1) that the student will complete the program.';
comment on column public.student_risk_status.probabilities_updated_at is 'Timestamp of last AI probability scoring run.';

create index if not exists student_risk_status_placement_prob_idx
  on public.student_risk_status (placement_probability)
  where placement_probability is not null;
