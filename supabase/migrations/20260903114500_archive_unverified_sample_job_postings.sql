-- Remove verified sample/test vacancies from production-facing career feeds.
-- Rows are retained for audit/recovery; only publication status changes.
UPDATE public.job_postings AS job
SET status = 'archived',
    updated_at = now()
WHERE job.status = 'active'
  AND (
    job.employer_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.employers AS employer
      WHERE employer.id = job.employer_id
        AND employer.approved IS NOT TRUE
        AND employer.verified_at IS NULL
        AND lower(coalesce(employer.company_name, employer.business_name, employer.name, '')) = 'test employer'
    )
  );