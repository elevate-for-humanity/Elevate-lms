
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const participantId = formData.get('participantId') as string;
    const action = formData.get('action') as string;

    if (!participantId || !['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('wioa_participants')
      .update({
        eligibility_status: action === 'approve' ? 'approved' : 'denied',
        eligibility_verified_at: new Date().toISOString(),
        eligibility_verified_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', participantId);

    if (error) throw error;

    await logAdminAudit({
      action: AdminAction.WIOA_ELIGIBILITY_VERIFIED,
      actorId: user?.id || 'unknown',
      entityType: 'wioa_participants',
      entityId: participantId,
      metadata: { decision: action },
      req: request,
    });

    // Redirect back to the verification list
    return NextResponse.redirect(new URL('/admin/wioa/verify', request.url));
  } catch (error) {
    logger.error('WIOA verification failed', error as Error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/admin/wioa/verify', _POST);
