/**
 * GET /api/admin/videos
 *
 * Returns published videos for the admin video library.
 * Optional ?courseId= to scope to a specific course.
 * Used by VideoManagerClient to refresh the video list.
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
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '100'), 200);

    let query = db
      .from('videos')
      .select('id, title, url, created_at, duration_seconds, status, course_id')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;
    if (error) return safeError('Failed to fetch videos', 400);

    // Normalize to the shape VideoManagerClient expects
    const videos = (data ?? []).map(v => ({
      id: v.id,
      title: v.title,
      url: v.url ?? '',
      created_at: v.created_at,
      duration_minutes: v.duration_seconds != null ? Math.round(v.duration_seconds / 60) : null,
    }));

    return NextResponse.json({ data: videos });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

export const GET = withApiAudit('/api/admin/videos', _GET);
