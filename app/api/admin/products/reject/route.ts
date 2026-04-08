import { NextResponse } from 'next/server';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

// Using Node.js runtime for email compatibility
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Auth first — before any DB mutation
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: roleProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!roleProfile || !['admin', 'super_admin', 'staff'].includes(roleProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const { productId, reason } = body ?? {};

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Pre-read: verify product exists before updating
    const { data: product, error: fetchError } = await supabase
      .from('marketplace_products')
      .select('id, status')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('marketplace_products')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'Does not meet marketplace standards',
      })
      .eq('id', productId);

    if (error) throw error;

    await logAdminAudit({
      action: AdminAction.PRODUCT_REJECTED,
      actorId: user.id,
      entityType: 'marketplace_products',
      entityId: productId,
      metadata: { reason },
      req,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/admin/products/reject', _POST);
