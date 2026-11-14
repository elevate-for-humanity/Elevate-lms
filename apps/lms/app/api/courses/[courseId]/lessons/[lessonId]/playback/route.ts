import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
import { resolveCoursePreview } from '@/lib/admin/course-preview';
import { signedLessonPlayback } from '@/lib/storage/lesson-playback';
import { renderMediaUrl } from '@/lib/ultimate-course-builder/media/playback-source.mjs';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { measuredLessonAsset } from '@/lib/video/measured-lesson-assets';
import { streamLessonMedia, inspectLessonMedia } from '@/lib/storage/lesson-stream';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const { courseId, lessonId } = await params;
  const asset = new URL(_request.url).searchParams.get('asset') || 'video';
  if (!['video', 'captions', 'transcript'].includes(asset))
    return NextResponse.json({ error: 'Invalid lesson media type' }, { status: 400, headers });
  try {
    const preview = await resolveCoursePreview(courseId);
    const user = await getCurrentUser();
    if (!preview.active && !user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    const diagnostic = new URL(_request.url).searchParams.get('diagnostic') === '1';
    if (diagnostic && !preview.active)
      return NextResponse.json(
        { error: 'Signed administrative course preview required' },
        { status: 403, headers },
      );
    const limited = await applyRateLimit(_request, 'api', {
      key: `lesson-playback:${user?.id || `preview:${courseId}`}`,
    });
    if (limited) {
      for (const [key, value] of Object.entries(headers)) limited.headers.set(key, value);
      return limited;
    }
    if (!preview.active) {
      try {
        await assertLessonAccess(user!.id, lessonId);
      } catch (error) {
        const denied = accessErrorResponse(error);
        return NextResponse.json(denied.body, { status: denied.status, headers });
      }
    }
    const db = preview.active ? preview.db : await requireAdminClient();
    let query = db
      .from('course_lessons')
      .select(
        'film_duration:content_json->film->durationSeconds,film_cues:content_json->film->captionCues,film_transcript:content_json->film->>measuredTranscript,film_transcript_url:content_json->film->>transcriptUrl,experience_transcript_url:content_json->experience->film->>transcriptUrl,video_url,film_media_url:content_json->film->>mediaUrl,film_video_url:content_json->film->>videoUrl,film_playback_url:content_json->film->>playbackUrl,film_caption_url:content_json->film->>captionsUrl,scene_caption_url:content_json->film->sceneData->>captionUrl,experience_caption_url:content_json->experience->film->>captionsUrl,experience_scene_caption_url:content_json->experience->film->sceneData->>captionUrl,interactive_caption_url:content_json->experience->interactiveVideo->>captionsUrl,media_caption_url:content_json->experience->media->>caption_url',
      )
      .eq('course_id', courseId)
      .eq('id', lessonId);
    if (!preview.active) query = query.eq('is_published', true);
    const { data: lesson, error } = await query.maybeSingle();
    if (error) throw error;
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404, headers });
    if (asset !== 'video') {
      const material = measuredLessonAsset(asset, {
        durationSeconds: lesson.film_duration,
        captionCues: lesson.film_cues,
        measuredTranscript: lesson.film_transcript,
      });
      if (material)
        return new NextResponse(material.body, {
          headers: {
            ...headers,
            'Content-Type': material.contentType,
            'X-Content-Type-Options': 'nosniff',
          },
        });
      if (asset === 'captions' && lesson.film_cues != null)
        return NextResponse.json(
          { error: 'Lesson material unavailable' },
          { status: 404, headers },
        );
    }
    const source =
      asset === 'transcript'
        ? [lesson.film_transcript_url, lesson.experience_transcript_url].find(
            (value) => typeof value === 'string' && value.startsWith('https://'),
          )
        : asset === 'captions'
          ? [
              lesson.interactive_caption_url,
              lesson.film_caption_url,
              lesson.scene_caption_url,
              lesson.experience_caption_url,
              lesson.experience_scene_caption_url,
              lesson.media_caption_url,
            ].find((value) => typeof value === 'string' && value.startsWith('https://'))
          : renderMediaUrl({
              mediaUrl: lesson.film_media_url,
              videoUrl: lesson.film_video_url,
              playbackUrl: lesson.film_playback_url,
            }) || lesson.video_url;
    if (!source) return NextResponse.json({ error: 'Video unavailable' }, { status: 404, headers });
    const location = await signedLessonPlayback(db, source);
    if (diagnostic)
      return NextResponse.json(
        await inspectLessonMedia(_request, location, asset as 'video' | 'captions' | 'transcript'),
        { headers },
      );
    return await streamLessonMedia(
      _request,
      location,
      asset as 'video' | 'captions' | 'transcript',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const reason = [
      'LESSON_MEDIA_STORAGE_REFERENCE_REQUIRED',
      'LESSON_MEDIA_REFERENCE_INVALID',
      'LESSON_MEDIA_SIGNING_FAILED',
      'LESSON_MEDIA_UPSTREAM_UNAVAILABLE',
      'LESSON_MEDIA_TYPE_INVALID',
    ].includes(message)
      ? message
      : 'LESSON_MEDIA_UNAVAILABLE';
    return NextResponse.json(
      { error: 'Video delivery unavailable', reason },
      { status: 503, headers },
    );
  }
}
