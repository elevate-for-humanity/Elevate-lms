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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'program_holder') {
      return NextResponse.json({ error: 'Forbidden - Program holder access only' }, { status: 403 });
    }

    const students = await getProgramHolderStudents(user.id);

    return NextResponse.json({ students });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/program-holder/students', _GET);
