import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: enrollments, error } = await db
      .from('program_enrollments')
      .select(`
        id,
        course_id,
        status,
        progress,
        started_at,
        completed_at,
        created_at,
        courses (
          id,
          title,
          slug,
          description,
          duration_hours
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[Student Enrollments] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }

    return NextResponse.json({ enrollments: enrollments || [] });
  } catch (error) {
    logger.error('[Student Enrollments] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/student/enrollments', _GET);
