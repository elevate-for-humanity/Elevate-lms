import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function guardAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// GET - Fetch all career courses with modules
async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const supabase = await requireAdminClient();

    const { data: courses, error } = await supabase
      .from('career_courses')
      .select(
        `
        *,
        modules:career_course_modules(*)
      `,
      )
      .eq('is_active', true)
      .eq('is_bundle', false)
      .order('title');

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST - Retired catalog sync compatibility endpoint
async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { action } = await req.json();

    if (action === 'sync-stripe') {
      return NextResponse.json({
        error: 'Legacy product synchronization is retired. Set course prices in the active program catalog.',
      }, { status: 410 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/career-courses', _GET);
export const POST = withApiAudit('/api/admin/career-courses', _POST);
