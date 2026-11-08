-- PARIS production acceptance baseline (read-only).
-- Execute in the authorized Supabase SQL editor. No data is changed.
-- A completed event is a recorded status, NOT proof of external execution.
SELECT status, count(*) AS repairs,
       count(*) FILTER (WHERE workflow_run_id IS NOT NULL) AS workflow_receipts,
       count(*) FILTER (WHERE release_sha IS NOT NULL) AS release_receipts
FROM public.paris_code_repairs GROUP BY status ORDER BY status;

SELECT operation, status, coalesce(failure_category, 'unknown') AS failure_category,
       count(*) AS events, max(created_at) AS most_recent
FROM public.paris_runtime_events
GROUP BY operation, status, coalesce(failure_category, 'unknown')
ORDER BY events DESC;

SELECT status, count(*) AS jobs,
       count(*) FILTER (WHERE completed_at IS NOT NULL) AS completion_timestamps
FROM public.course_factory_jobs GROUP BY status ORDER BY status;

SELECT status, count(*) AS runs,
       count(*) FILTER (WHERE completed_at IS NOT NULL) AS completion_timestamps
FROM public.agentic_build_runs GROUP BY status ORDER BY status;

SELECT 'generated_content' AS evidence_store, count(*) AS records FROM public.generated_content
UNION ALL SELECT 'published_posts', count(*) FROM public.published_posts
UNION ALL SELECT 'media_jobs', count(*) FROM public.media_jobs
UNION ALL SELECT 'agent_activities', count(*) FROM public.agent_activities;

-- Do not automatically unblock or relabel records based on these counts.
-- A repair is accepted only after source diff, commit readback, independent tests,
-- deployment SHA, and a live reproduction of the original defect are checked.
