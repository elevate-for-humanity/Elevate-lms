/** RETIRED: LMS does not create complete course packages. Use Studio -> Course Builder. */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();
  if (!profile || !['admin', 'instructor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin or Instructor role required' }, { status: 403 });
  }

  return NextResponse.json(
    {
      error: 'COURSE_BUILDER_ROOT_REQUIRED',
      message: 'LMS course creation is retired. Create courses through Studio and the canonical Course Builder.',
      canonicalEndpoint: '/api/admin/course-builder',
      action: 'generate',
    },
    { status: 410 },
  );
}

export const POST = withApiAudit('/api/courses/create', _POST);
