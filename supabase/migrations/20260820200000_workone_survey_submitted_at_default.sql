-- WorkOne survey: submitted_at must mean an actual applicant submission.
--
-- workone_survey_responses was created (20260819000001) with
--   submitted_at TIMESTAMPTZ DEFAULT NOW()
-- so every row inserted by the WorkOne handoff (lib/workone/handoff.ts)
-- is stamped "submitted" at creation even though the applicant has not
-- submitted anything (progress_status = 'not_started'). The Admin survey
-- responses surface counts submitted_at IS NOT NULL as a response, so
-- untouched handoff rows masquerade as survey responses.
--
-- Both real writers set submitted_at explicitly when an applicant
-- actually submits (apps/marketing/app/api/workone/progress/route.ts and
-- apps/admin/app/api/surveys/workone/submit/route.ts), so the default is
-- dropped: new rows start with submitted_at NULL until a submission.

alter table public.workone_survey_responses
  alter column submitted_at drop default;

-- Clear the default-stamped value from rows that never had a submission:
-- no progress made, never updated by the applicant, and none of the
-- survey-only answer columns filled. Rows with genuine applicant
-- activity keep their submitted_at (it records their last submission).
update public.workone_survey_responses
set submitted_at = null
where submitted_at is not null
  and progress_status = 'not_started'
  and last_updated_by_applicant_at is null
  and was_put_in_other_program is null
  and was_persuaded_away_from_elevate is null
  and other_program_details is null
  and preferred_contact_method is null;
