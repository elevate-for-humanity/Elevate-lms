CREATE OR REPLACE FUNCTION public.wioa_participants_for_quarter(quarter_start date, quarter_end date)
 RETURNS TABLE(participant_id uuid, user_id uuid, first_name text, last_name text, date_of_birth date, ssn_last4 text, zip_code text, gender text, race_ethnicity text, veteran_status boolean, disability_status boolean, employment_status_at_entry text, education_level_at_entry text, enrollment_date date, exit_date date, funding_source text, employed_q2_after_exit boolean, employed_q4_after_exit boolean, median_earnings_q2 numeric, credential_attained boolean, measurable_skill_gain boolean, employer_name text, job_title text, employment_date date, hourly_wage numeric, annual_salary numeric, credential_name text, credential_issued_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT
    wp.id,
    wp.user_id,
    COALESCE(wp.first_name, profile.first_name),
    COALESCE(wp.last_name, profile.last_name),
    COALESCE(wpr.date_of_birth, wp.date_of_birth),
    wpr.ssn_last4,
    COALESCE(profile.zip_code, profile.zip),
    COALESCE(wpr.gender, wp.gender),
    wpr.race_ethnicity,
    COALESCE(wpr.veteran_status, wp.is_veteran, false),
    COALESCE(wpr.disability_status, wp.has_disability, false),
    COALESCE(wpr.employment_status_at_entry, wp.employment_status_at_entry),
    wpr.education_level_at_entry,
    wpr.program_entry_date,
    wpr.program_exit_date,
    wp.funding_source,
    wpr.employed_q2_after_exit,
    wpr.employed_q4_after_exit,
    wpr.median_earnings_q2,
    COALESCE(wpr.credential_attained, false),
    COALESCE(wpr.measurable_skill_gain, false),
    outcome.employer_name,
    outcome.job_title,
    outcome.start_date,
    outcome.hourly_wage,
    outcome.annual_salary,
    certificate.title,
    certificate.issued_at
  FROM public.wioa_participants wp
  JOIN public.wioa_participant_records wpr ON wpr.participant_id = wp.id
  LEFT JOIN public.profiles profile ON profile.id = wp.user_id
  LEFT JOIN LATERAL (
    SELECT eo.employer_name, eo.job_title, eo.start_date,
           eo.hourly_wage, eo.annual_salary
    FROM public.employment_outcomes eo
    WHERE COALESCE(eo.user_id, eo.user_uuid) = wp.user_id
    ORDER BY eo.start_date DESC NULLS LAST
    LIMIT 1
  ) outcome ON true
  LEFT JOIN LATERAL (
    SELECT COALESCE(c.title, c.course_title, c.course_name) title, c.issued_at
    FROM public.certificates c
    WHERE COALESCE(c.user_id, c.student_id) = wp.user_id
      AND c.status = 'active'
    ORDER BY c.issued_at DESC NULLS LAST
    LIMIT 1
  ) certificate ON true
  WHERE wp.eligibility_status = 'verified'
    AND wpr.program_entry_date <= quarter_end
    AND (wpr.program_exit_date IS NULL OR wpr.program_exit_date >= quarter_start)
$function$

REVOKE ALL ON FUNCTION public.wioa_participants_for_quarter(date,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wioa_participants_for_quarter(date,date) TO service_role;
