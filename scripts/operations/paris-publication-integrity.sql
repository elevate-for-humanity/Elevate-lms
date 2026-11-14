-- PARIS canonical publication integrity evidence. READ ONLY.
-- Do not backfill a historical version or change a learner's pinned version.
-- A published lesson flag without course_versions is not automatically a
-- chronological defect: partial Ultimate releases use a separate mechanism.
WITH lessons AS (
 SELECT l.course_id,
   count(*) FILTER (WHERE l.is_published=true) AS flagged,
   count(*) FILTER (WHERE l.is_published=true AND l.status::text='published') AS status_aligned,
   count(*) FILTER (WHERE l.is_published=true AND l.approved=true) AS approved,
   count(*) FILTER (WHERE l.is_published=true AND l.video_status='complete' AND nullif(l.video_url,'') IS NOT NULL) AS playable,
   count(*) FILTER (WHERE l.is_published=true AND l.module_id IS NULL) AS missing_module,
   count(*) FILTER (WHERE l.is_published=true AND l.order_index IS NULL) AS missing_order
 FROM public.course_lessons l GROUP BY l.course_id
),
versioned AS (
 SELECT course_id,count(*) FILTER (WHERE is_published=true) AS published_versions
 FROM public.course_versions GROUP BY course_id
),
ultimate AS (
 SELECT course_id,count(*) FILTER (WHERE status='released') AS released_versions
 FROM public.ultimate_release_versions GROUP BY course_id
),
weeks AS (
 SELECT course_id,count(*) AS release_weeks
 FROM public.course_lesson_release_weeks GROUP BY course_id
)
SELECT c.id AS course_id,c.title,c.status::text AS course_status,
 coalesce(l.flagged,0) AS published_lesson_flags,
 coalesce(l.status_aligned,0) AS aligned_lesson_statuses,
 coalesce(l.approved,0) AS independently_approved_lessons,
 coalesce(l.playable,0) AS lessons_with_completed_video,
 coalesce(l.missing_module,0) AS missing_module,
 coalesce(l.missing_order,0) AS missing_order,
 coalesce(v.published_versions,0) AS published_legacy_versions,
 coalesce(u.released_versions,0) AS canonical_ultimate_releases,
 coalesce(w.release_weeks,0) AS weekly_release_mappings,
 CASE
  WHEN coalesce(l.flagged,0)=0 THEN 'no_published_lesson_flags'
  WHEN coalesce(l.missing_module,0)>0 OR coalesce(l.missing_order,0)>0 THEN 'source_order_integrity_review'
  WHEN coalesce(v.published_versions,0)>0 OR coalesce(u.released_versions,0)>0 THEN 'verify_exact_lesson_release_membership'
  WHEN c.status::text='draft' THEN 'draft_course_has_incrementally_published_lessons'
  WHEN coalesce(l.approved,0)<coalesce(l.flagged,0) OR coalesce(l.playable,0)<coalesce(l.flagged,0)
   THEN 'publication_acceptance_evidence_missing'
  ELSE 'no_canonical_release_receipt_review_required'
 END AS remediation_class
FROM public.courses c
LEFT JOIN lessons l ON l.course_id=c.id
LEFT JOIN versioned v ON v.course_id=c.id
LEFT JOIN ultimate u ON u.course_id=c.id
LEFT JOIN weeks w ON w.course_id=c.id
WHERE coalesce(l.flagged,0)>0
ORDER BY coalesce(l.flagged,0) DESC,c.title;
