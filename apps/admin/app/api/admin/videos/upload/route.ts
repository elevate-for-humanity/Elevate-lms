import { NextRequest, NextResponse } from 'next/server';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withAuth } from '@/lib/with-auth';
import { toErrorMessage } from '@/lib/safe';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_BYTES = 200 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
}

const _POST = withAuth(
  async (request: NextRequest, user) => {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    try {
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

      const { error: uploadError } = await db.storage.from(bucket).upload(storagePath, file, {
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
          return NextResponse.json({ error: 'Course video saved but playback URL could not be created' }, { status: 500 });
        }

        await logAdminAudit({
          action: AdminAction.VIDEO_UPLOADED,
          actorId: user.id,
          entityType: 'course_videos',
          entityId: videoData.id,
          metadata: { file_name: file.name, course_id: courseId || null, lesson_id: lessonId || null },
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
      });

      return NextResponse.json({ success: true, url: publicUrl, video: videoData });
    } catch (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }
  },
  { roles: ['admin'] },
);

export const POST = withApiAudit('/api/admin/videos/upload', _POST);
