export const dynamic = 'force-dynamic';
// Using Node.js runtime for email compatibility
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent, AuditActions, getRequestMetadata } from '@/lib/audit';
import { sendCreatorApprovalEmail } from '@/lib/email/sendgrid';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { creatorId } = await req.json();
    const { ipAddress } = getRequestMetadata(req);

    // Get creator details
    const { data: creator } = await db
      .from('marketplace_creators')
      .select('user_id, profiles(email, full_name)')
      .eq('id', creatorId)
      .single();

    const { error } = await db
      .from('marketplace_creators')
      .update({ status: 'approved' })
      .eq('id', creatorId);

    if (error) throw error;

    // Audit log
    await logAuditEvent({
      userId: user.id,
      action: AuditActions.MARKETPLACE_CREATOR_APPROVED,
      resourceType: 'marketplace_creator',
      resourceId: creatorId,
      ipAddress,
    });

    // Send approval email
    const profile = creator?.profiles as any;
    if (profile?.email) {
      try {
        await sendCreatorApprovalEmail({
          email: profile.email,
          name: profile.full_name || 'Creator',
        });
      } catch (error) {
          logger.error("Unhandled error", error instanceof Error ? error : undefined);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: toErrorMessage(err) }, { status: 500 });
  }
}
