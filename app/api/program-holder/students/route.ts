import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProgramHolderStudents } from '@/lib/program-holder-access';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, program_holder_id')
      .eq('id', user.id)
      .maybeSingle();

    const allowedRoles = ['program_holder', 'admin', 'super_admin', 'staff'];
    if (!profile || !allowedRoles.includes(profile.role ?? '')) {
      return NextResponse.json(
        { error: 'Forbidden - Program holder access only' },
        { status: 403 },
      );
    }

    let holderId = profile.program_holder_id;
    if (!holderId) {
      const { data: fallback } = await supabase
        .from('program_holders')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      holderId = fallback?.id ?? null;
    }

    if (!holderId) {
      return NextResponse.json({ error: 'Program holder record not found' }, { status: 403 });
    }

    const students = await getProgramHolderStudents(holderId);

    return NextResponse.json({ students });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/program-holder/students', _GET);
