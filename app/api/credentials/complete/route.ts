import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { provider, course_name } = await req.json();

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update credential status
    const { error } = await db
      .from('external_credentials')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('student_id', user.id)
      .eq('provider', provider);

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: 'Failed to mark credential complete' },
        { status: 500 }
      );
    }

    // Update exam readiness if Milady RISE
    if (provider === 'Milady RISE') {
      await db.from('exam_readiness').upsert({
        student_id: user.id,
        theory_complete: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to mark credential complete' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/credentials/complete', _POST);
