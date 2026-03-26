import { NextResponse } from 'next/server';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

// Using Node.js runtime for email compatibility
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    await requireAdmin();

    const supabase = await createClient();
    const { productId, reason } = await req.json();

    const { error } = await supabase
      .from('marketplace_products')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'Does not meet marketplace standards',
      })
      .eq('id', productId);

    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await logAdminAudit({ action: AdminAction.PRODUCT_REJECTED, actorId: user.id, entityType: 'marketplace_products', entityId: productId, metadata: { reason }, req });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ err: toErrorMessage(err) }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/admin/products/reject', _POST);
