import { NextRequest, NextResponse } from 'next/server';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withAuth } from '@/lib/with-auth';
import { toErrorMessage } from '@/lib/safe';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resetCanonicalMediaJob } from '@/lib/course-factory/media-manager';
import { queueCourseLessonVideos } from '@/lib/course-factory/media-service';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_BYTES = 200 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
}

type CourseUploadControl = {
  action?: 'prepare' | 'finalize';
  title?: string;
  description?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  courseId?: string;
  lessonId?: string;
  storagePath?: string;
};

async function queueLicensedLessonRender(courseId: string, lessonId: string) {
  const db = await requireAdminClient();
  const { data: existingJob, error } = await db
    .from('video_jobs')
    .select('id,status')
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .eq('asset_kind', 'lesson')
    .is('asset_key', null)
    .maybeSingle();
  if (error) throw error;

  if (existingJob) {
    return resetCanonicalMediaJob(
      { courseId, lessonId, assetKind: 'lesson', assetKey: null },
      {
        force: true,
        sourceRepaired: true,
        reason: 'Licensed lesson footage uploaded; rebuilding the canonical lesson video',
      },
    );
  }

  const queued = await queueCourseLessonVideos({
    courseId,
    lessonId,
    onlyMissing: false,
    force: true,
  });
  if (queued.queued < 1 && queued.alreadyActive < 1 && queued.lessonVideosReady < 1) {
    throw new Error('Canonical lesson video job was not queued');
  }
  return null;
}

async function controlCourseUpload(
  input: CourseUploadControl,
  userId: string,
  request: NextRequest,
) {
  const title = String(input.title ?? '').trim();
  const courseId = String(input.courseId ?? '').trim();
  const lessonId = String(input.lessonId ?? '').trim();
  const fileName = cleanName(String(input.fileName ?? '').trim());
  const fileType = String(input.fileType ?? '').trim();
  const fileSize = Number(input.fileSize ?? 0);
  if (!title || !courseId || !lessonId || !UUID.test(courseId) || !UUID.test(lessonId)) {
    return NextResponse.json(
      { error: 'A valid title, courseId, and lessonId are required' },
      { status: 400 },
    );
  }

  const db = await requireAdminClient();
  const { data: lesson, error: lessonLookupError } = await db
    .from('course_lessons')
    .select('id')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .maybeSingle();
  if (lessonLookupError || !lesson) {
    return NextResponse.json(
      { error: 'Lesson does not belong to the selected course' },
      { status: 400 },
    );
  }

  if (input.action === 'prepare') {
    if (!fileName || !fileType.startsWith('video/') || fileSize <= 0 || fileSize > MAX_BYTES) {
      return NextResponse.json(
        { error: 'A valid video file of 200 MB or less is required' },
        { status: 400 },
      );
    }
    const storagePath = `${courseId}/${Date.now()}-${fileName}`;
    const { data, error } = await db.storage
      .from('course_videos')
      .createSignedUploadUrl(storagePath);
    if (error || !data?.token) {
      return NextResponse.json(
        { error: 'Could not prepare the private video upload' },
        { status: 500 },
      );
    }
    return NextResponse.json({
      success: true,
      bucket: 'course_videos',
      storagePath,
      token: data.token,
    });
  }

  if (input.action !== 'finalize' || !input.storagePath?.startsWith(`${courseId}/`)) {
    return NextResponse.json({ error: 'Invalid upload finalization request' }, { status: 400 });
  }

  const storagePath = input.storagePath;
  const { data: signed, error: signedError } = await db.storage
    .from('course_videos')
    .createSignedUrl(storagePath, 60 * 60);
  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Uploaded video could not be verified' }, { status: 400 });
  }
  const { data: videoData, error: videoError } = await db
    .from('course_videos')
    .insert({
      title,
      course_id: courseId,
      lesson_id: lessonId,
      storage_path: storagePath,
      generated_by: 'manual',
      status: 'ready',
      created_by: userId,
    })
    .select('id,title,course_id,lesson_id,storage_path,status,created_at')
    .single();
  if (videoError) {
    await db.storage.from('course_videos').remove([storagePath]);
    return NextResponse.json(
      { error: 'Uploaded video metadata could not be saved' },
      { status: 500 },
    );
  }
  const { error: lessonError } = await db
    .from('course_lessons')
    .update({
      media_origin: 'uploaded',
      media_quality_status: 'pending',
      video_status: 'queued',
      video_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lessonId)
    .eq('course_id', courseId);
  if (lessonError) {
    await db.from('course_videos').delete().eq('id', videoData.id);
    await db.storage.from('course_videos').remove([storagePath]);
    return NextResponse.json(
      { error: 'Uploaded video could not be linked to its lesson' },
      { status: 500 },
    );
  }
  try {
    await queueLicensedLessonRender(courseId, lessonId);
  } catch (queueError) {
    await db
      .from('course_lessons')
      .update({
        video_status: 'failed',
        video_error: `Licensed footage saved, but render queue failed: ${toErrorMessage(queueError)}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonId)
      .eq('course_id', courseId);
    return NextResponse.json(
      { error: 'Video was saved, but its lesson render could not be queued' },
      { status: 500 },
    );
  }
  await logAdminAudit({
    action: AdminAction.VIDEO_UPLOADED,
    actorId: userId,
    entityType: 'course_videos',
    entityId: videoData.id,
    metadata: { file_name: fileName, course_id: courseId, lesson_id: lessonId },
    req: request,
  });
  return NextResponse.json({ success: true, url: signed.signedUrl, video: videoData });
}

const _POST = withAuth(
  async (request: NextRequest, user) => {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    try {
      if (request.headers.get('content-type')?.includes('application/json')) {
        return controlCourseUpload((await request.json()) as CourseUploadControl, user.id, request);
      }
      const formData = await request.formData();
      const file = formData.get('file');
      const title = String(formData.get('title') ?? '').trim();
      const description = String(formData.get('description') ?? '').trim();
      const category = String(formData.get('category') ?? 'Training').trim() || 'Training';
      const courseId = String(formData.get('courseId') ?? '').trim();
      const lessonId = String(formData.get('lessonId') ?? '').trim();

      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
      }
      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }
      if (!file.type.startsWith('video/')) {
        return NextResponse.json({ error: 'Only video files are accepted' }, { status: 400 });
      }
      if (file.size <= 0 || file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: `Video must be between 1 byte and ${Math.round(MAX_BYTES / (1024 * 1024))} MB` },
          { status: 413 },
        );
      }
      if (courseId && !UUID.test(courseId)) {
        return NextResponse.json({ error: 'courseId must be a UUID' }, { status: 400 });
      }
      if (lessonId && !UUID.test(lessonId)) {
        return NextResponse.json({ error: 'lessonId must be a UUID' }, { status: 400 });
      }

      const db = await requireAdminClient();
      const isCourseVideo = Boolean(courseId || lessonId);
      const bucket = isCourseVideo ? 'course_videos' : 'course-videos';
      const folder = isCourseVideo ? courseId || 'unassigned' : 'public';
      const storagePath = `${folder}/${Date.now()}-${cleanName(file.name)}`;

      // Supabase's Node storage client expects bytes/Blob data. Passing the
      // undici File returned by NextRequest.formData() is unreliable in the
      // production runtime and was causing valid MP4 uploads to fail before an
      // object was ever created.
      const fileBytes = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await db.storage.from(bucket).upload(storagePath, fileBytes, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) {
        return NextResponse.json({ error: 'Video storage upload failed' }, { status: 500 });
      }

      if (isCourseVideo) {
        const { data: videoData, error: dbError } = await db
          .from('course_videos')
          .insert({
            title,
            course_id: courseId || null,
            lesson_id: lessonId || null,
            storage_path: storagePath,
            duration_seconds: null,
            generated_by: 'manual',
            status: 'ready',
            created_by: user.id,
          })
          .select('id,title,course_id,lesson_id,storage_path,status,created_at')
          .single();

        if (dbError) {
          await db.storage.from(bucket).remove([storagePath]);
          return NextResponse.json({ error: 'Course video metadata save failed' }, { status: 500 });
        }

        const { data: signed, error: signedError } = await db.storage
          .from(bucket)
          .createSignedUrl(storagePath, 60 * 60);
        if (signedError || !signed?.signedUrl) {
          return NextResponse.json(
            { error: 'Course video saved but playback URL could not be created' },
            { status: 500 },
          );
        }

        // lesson_id is the durable association. The video worker resolves a
        // fresh signed URL from this row at render time, so private licensed
        // footage never depends on an expired URL stored in scene_data.
        if (lessonId) {
          const { error: lessonError } = await db
            .from('course_lessons')
            .update({
              media_origin: 'uploaded',
              media_quality_status: 'pending',
              video_status: 'queued',
              video_error: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', lessonId)
            .eq('course_id', courseId);
          if (lessonError) {
            await db.from('course_videos').delete().eq('id', videoData.id);
            await db.storage.from(bucket).remove([storagePath]);
            return NextResponse.json(
              { error: 'Video uploaded but lesson linking failed' },
              { status: 500 },
            );
          }
          try {
            await queueLicensedLessonRender(courseId, lessonId);
          } catch (queueError) {
            await db
              .from('course_lessons')
              .update({
                video_status: 'failed',
                video_error: `Licensed footage saved, but render queue failed: ${toErrorMessage(queueError)}`,
                updated_at: new Date().toISOString(),
              })
              .eq('id', lessonId)
              .eq('course_id', courseId);
            return NextResponse.json(
              { error: 'Video was saved, but its lesson render could not be queued' },
              { status: 500 },
            );
          }
        }

        await logAdminAudit({
          action: AdminAction.VIDEO_UPLOADED,
          actorId: user.id,
          entityType: 'course_videos',
          entityId: videoData.id,
          metadata: {
            file_name: file.name,
            course_id: courseId || null,
            lesson_id: lessonId || null,
          },
          req: request,
        });

        return NextResponse.json({ success: true, url: signed.signedUrl, video: videoData });
      }

      const {
        data: { publicUrl },
      } = db.storage.from(bucket).getPublicUrl(storagePath);

      const { data: videoData, error: dbError } = await db
        .from('videos')
        .insert({
          title,
          description: description || null,
          url: publicUrl,
          video_url: publicUrl,
          published: true,
          category,
        })
        .select('id,title,description,url,video_url,published,category,created_at')
        .single();

      if (dbError) {
        await db.storage.from(bucket).remove([storagePath]);
        return NextResponse.json({ error: 'Video metadata save failed' }, { status: 500 });
      }

      await logAdminAudit({
        action: AdminAction.VIDEO_UPLOADED,
        actorId: user.id,
        entityType: 'videos',
        entityId: videoData.id,
        metadata: { file_name: file.name, category },
        req: request,
