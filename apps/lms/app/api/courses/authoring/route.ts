// LMS course authoring catalog: read-only. Complete course creation belongs to Studio -> Course Builder.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (profile.role !== 'admin') query = query.eq('created_by', user.id);

    const { data: courses, error } = await query;
    if (error) {
      logger.error('Error fetching courses', normalizeError(error, 'Failed to fetch courses'), getErrorContext(error));
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }

    return NextResponse.json({ courses: courses || [] });
  } catch (error) {
    logger.error('[Course Authoring Error]', normalizeError(error, 'Course authoring failed'), getErrorContext(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'instructor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(
    {
      error: 'COURSE_BUILDER_ROOT_REQUIRED',
      message: 'LMS complete-course creation is retired. Create courses through Studio and the canonical Course Builder.',
      canonicalEndpoint: '/api/admin/course-builder',
      canonicalSurface: '/studio/courses',
      action: 'generate',
    },
    { status: 410 },
  );
}

export const GET = withApiAudit('/api/courses/authoring', _GET);
export const POST = withApiAudit('/api/courses/authoring', _POST);
