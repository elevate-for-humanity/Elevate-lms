/** RETIRED: persisted-course publication is owned by POST /api/admin/course-builder action=publish-persisted. */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'staff', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { courseId } = await params;
  return NextResponse.json({
    error: 'COURSE_BUILDER_ROOT_REQUIRED',
    message: 'Persisted course publication moved to the canonical Course Builder root.',
    canonicalEndpoint: '/api/admin/course-builder',
    action: 'publish-persisted',
    courseId,
  }, { status: 410 });
}
