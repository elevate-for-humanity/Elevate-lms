/**
 * GET /api/admin/videos
 *
 * Returns only real, playable video records.
 * - No courseId: public production videos from public.videos.
 * - courseId: protected course videos from public.course_videos with signed playback URLs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const courseId = req.nextUrl.searchParams.get('courseId');
    const requestedLimit = Number.parseInt(req.nextUrl.searchParams.get('limit') ?? '100', 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 100;

    if (courseId) {
      const { data, error } = await db
        .from('course_videos')
        .select('id,title,video_url,storage_path,duration_seconds,thumbnail_url,status,created_at,course_id,lesson_id')
        .eq('course_id', courseId)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return safeError('Failed to fetch course videos', 400);

      const videos = await Promise.all(
        (data ?? []).map(async (video) => {
          let playbackUrl = video.video_url ?? '';
          if (!playbackUrl && video.storage_path) {
            const { data: signed } = await db.storage
              .from('course_videos')
              .createSignedUrl(video.storage_path, 60 * 60);
            playbackUrl = signed?.signedUrl ?? '';
          }
          return {
            id: video.id,
            title: video.title ?? 'Course video',
            url: playbackUrl,
            created_at: video.created_at,
            duration_minutes:
              video.duration_seconds != null ? Math.round(video.duration_seconds / 60) : null,
            course_id: video.course_id,
            lesson_id: video.lesson_id,
          };
        }),
      );

      return NextResponse.json({ data: videos.filter((video) => Boolean(video.url)) });
    }

    const { data, error } = await db
      .from('videos')
      .select('id,title,url,video_url,created_at,duration_seconds')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return safeError('Failed to fetch videos', 400);

    const videos = (data ?? [])
      .map((video) => ({
        id: video.id,
        title: video.title,
        url: video.video_url || video.url || '',
        created_at: video.created_at,
        duration_minutes:
          video.duration_seconds != null ? Math.round(video.duration_seconds / 60) : null,
      }))
      .filter((video) => Boolean(video.url));

    return NextResponse.json({ data: videos });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

export const GET = withApiAudit('/api/admin/videos', _GET);
