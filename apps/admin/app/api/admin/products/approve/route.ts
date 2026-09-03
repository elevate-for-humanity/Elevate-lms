import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (!adminProfile || !['admin'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const { productId } = body ?? {};

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const { data: product, error: fetchError } = await supabase
      .from('marketplace_products')
      .select('title, creator_id, status')
      .eq('id', productId)
      .maybeSingle();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('marketplace_products')
      .update({ status: 'approved' })
      .eq('id', productId);

    if (error) throw error;

    if (product?.creator_id) {
      try {
        const { data: creator } = await supabase
          .from('marketplace_creators')
          .select('user_id')
          .eq('id', product.creator_id)
          .maybeSingle();

        if (creator?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', creator.user_id)
            .maybeSingle();

          if (profile?.email) {
            const { sendProductApprovalEmail } = await import('@/lib/email/sendgrid');
            await sendProductApprovalEmail({
              email: profile.email,
              name: profile.full_name || 'Creator',
              productName: product.title || 'Your product',
            });
          }
        }
      } catch (emailErr) {
        const { logger } = await import('@/lib/logger');
        logger.warn('Failed to send product approval email', emailErr);
      }
    }

    await logAdminAudit({
      action: AdminAction.PRODUCT_APPROVED,
      actorId: user.id,
      entityType: 'marketplace_products',
      entityId: productId,
      metadata: { title: product?.title },
      req,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/admin/products/approve', _POST);
