import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export async function reviewLessonVideoCandidate(input: {
  jobId: string;
  reviewerId: string;
  decision: 'approve' | 'reject';
  notes?: string;
}) {
  const db = createAdminClient();
  const { data: job, error } = await db.from('video_jobs').select('*').eq('id', input.jobId).single();
  if (error || !job) throw new Error(error?.message ?? 'Video candidate not found');
  if (job.asset_kind !== 'lesson' || job.status !== 'complete' || job.review_status !== 'pending_review' || !job.video_url) {
    throw new Error('Video is not a reviewable lesson candidate');
  }
  const now = new Date().toISOString();
  if (input.decision === 'reject') {
    const { data: candidateVersion } = await db.from('lesson_video_versions').select('id').eq('video_job_id', job.id).maybeSingle();
    const rejectedVersion = {
      course_id: job.course_id, lesson_id: job.lesson_id, video_job_id: job.id, video_url: job.video_url,
      status: 'rejected', quality_evidence: job.quality_evidence, procedure_schema: job.procedure_schema,
      duration_seconds: job.duration_seconds, scene_count: job.scene_count, transcript: job.script ?? null,
    };
    const versionResult = candidateVersion?.id
      ? await db.from('lesson_video_versions').update(rejectedVersion).eq('id', candidateVersion.id)
      : await db.from('lesson_video_versions').insert(rejectedVersion);
    if (versionResult.error) throw versionResult.error;
    const { error: rejectError } = await db.from('video_jobs').update({
      review_status: 'rejected', reviewed_by: input.reviewerId, reviewed_at: now, review_notes: input.notes ?? null,
    }).eq('id', job.id).eq('review_status', 'pending_review');
    if (rejectError) throw rejectError;
    return { published: false, videoUrl: job.previous_video_url };
  }

  const { data: lesson, error: lessonError } = await db.from('course_lessons').select('video_url').eq('id', job.lesson_id).single();
  if (lessonError) throw lessonError;
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('org_id')
    .eq('id', job.course_id)
    .single();
  if (courseError) throw courseError;
  const { data: organization, error: organizationError } = await db
    .from('organizations')
    .select('tenant_id')
    .eq('id', course.org_id)
    .single();
  if (organizationError) throw organizationError;
  const tenantId = organization.tenant_id;
  if (!tenantId) throw new Error('Video cannot be published without a tenant-owned course');
  await db.from('lesson_video_versions').update({ status: 'archived' }).eq('lesson_id', job.lesson_id).eq('status', 'active');
  if (lesson.video_url && lesson.video_url !== job.video_url) {
    const { error: preserveError } = await db.from('lesson_video_versions').insert({
      course_id: job.course_id, lesson_id: job.lesson_id, video_url: lesson.video_url, status: 'archived',
    });
    if (preserveError) throw preserveError;
  }
  const { data: candidateVersion } = await db.from('lesson_video_versions').select('id').eq('video_job_id', job.id).maybeSingle();
  const activeVersion = {
    course_id: job.course_id, lesson_id: job.lesson_id, video_job_id: job.id, video_url: job.video_url, status: 'active',
    quality_evidence: job.quality_evidence, procedure_schema: job.procedure_schema,
    duration_seconds: job.duration_seconds, scene_count: job.scene_count,
    transcript: job.script ?? null,
    approved_by: input.reviewerId, approved_at: now,
  };
  const versionResult = candidateVersion?.id
    ? await db.from('lesson_video_versions').update(activeVersion).eq('id', candidateVersion.id)
    : await db.from('lesson_video_versions').insert(activeVersion);
  if (versionResult.error) throw versionResult.error;
  const { data: existingAsset } = await db.from('media_assets').select('id').eq('source_job_id', job.id).maybeSingle();
  const mediaAsset = {
    tenant_id: tenantId,
    org_id: course.org_id,
    asset_type: 'video',
    type: 'lesson_video',
    title: job.lesson_title,
    storage_path: job.video_url,
    public_url: job.video_url,
    mime_type: 'video/mp4',
    duration_seconds: job.duration_seconds,
    source_job_id: job.id,
    course_id: job.course_id,
    lesson_id: job.lesson_id,
    created_by: input.reviewerId,
    transcript: job.script ?? null,
    status: 'active',
    metadata: {
      review_status: 'approved',
      approved_at: now,
      quality_evidence: job.quality_evidence ?? {},
      procedure_schema: job.procedure_schema ?? {},
    },
  };
  const assetResult = existingAsset?.id
    ? await db.from('media_assets').update(mediaAsset).eq('id', existingAsset.id)
    : await db.from('media_assets').insert(mediaAsset);
  if (assetResult.error) throw assetResult.error;
  const { error: publishError } = await db.from('course_lessons').update({
    video_url: job.video_url, video_status: 'complete', video_error: null,
    video_generated_at: now, duration_seconds: job.duration_seconds, scene_data: job.scene_data,
  }).eq('id', job.lesson_id);
  if (publishError) throw publishError;
  const { error: approveError } = await db.from('video_jobs').update({
    review_status: 'approved', reviewed_by: input.reviewerId, reviewed_at: now, review_notes: input.notes ?? null,
  }).eq('id', job.id).eq('review_status', 'pending_review');
  if (approveError) throw approveError;
  return { published: true, videoUrl: job.video_url };
}

export async function rollbackLessonVideoVersion(input: { versionId: string; reviewerId: string; notes?: string }) {
  const db = createAdminClient();
  const { data: version, error } = await db.from('lesson_video_versions').select('*').eq('id', input.versionId).single();
  if (error || !version || version.status === 'rejected') throw new Error(error?.message ?? 'Restorable version not found');
  const now = new Date().toISOString();
  await db.from('lesson_video_versions').update({ status: 'archived' }).eq('lesson_id', version.lesson_id).eq('status', 'active');
  const { error: activateError } = await db.from('lesson_video_versions').update({ status: 'active', approved_at: now, approved_by: input.reviewerId }).eq('id', version.id);
  if (activateError) throw activateError;
  const { error: lessonError } = await db.from('course_lessons').update({ video_url: version.video_url, video_status: 'complete', video_error: null }).eq('id', version.lesson_id);
  if (lessonError) throw lessonError;
  return { videoUrl: version.video_url };
}
