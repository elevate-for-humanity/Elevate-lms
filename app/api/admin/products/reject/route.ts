export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

// Using Node.js runtime for email compatibility
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    await requireAdmin();

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { productId, reason } = await req.json();

    const { error } = await db
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
