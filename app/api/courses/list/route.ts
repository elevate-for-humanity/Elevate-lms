import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category');

    // Build query
    let query = db
      .from('courses')
      .select(
        `
        id,
        slug,
        title,
        description,
        category,
        level,
        duration,
        thumbnail_url,
        funding_programs,
        status,
        total_students,
        total_lessons,
        rating,
        created_at,
        updated_at
      `
      )
      .order('created_at', { ascending: false });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    const { data: courses, error } = await query;

    if (error) {
      logger.error('Courses fetch error:', error);
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 400 }
      );
    }

    return NextResponse.json({ courses });
  } catch (error) { 
    logger.error(
      'Courses list error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/courses/list', _GET);
