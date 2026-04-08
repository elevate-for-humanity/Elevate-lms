import { NextResponse } from 'next/server';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

// Using Node.js runtime for email compatibility
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const { productId } = body ?? {};

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Pre-read: verify product exists before updating
    const { data: product, error: fetchError } = await supabase
      .from('marketplace_products')
      .select('title, creator_id, status')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('marketplace_products')
      .update({ status: 'approved' })
      .eq('id', productId);

    if (error) throw error;

    // Send approval notification to creator
    if (product?.creator_id) {
      try {
        const { data: creator } = await supabase
          .from('marketplace_creators')
          .select('user_id')
          .eq('id', product.creator_id)
          .single();

        if (creator?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', creator.user_id)
            .single();

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
        // Non-fatal — product is already approved
        const { logger } = await import('@/lib/logger');
        logger.warn('Failed to send product approval email', emailErr);
      }
    }

    await logAdminAudit({ action: AdminAction.PRODUCT_APPROVED, actorId: user.id, entityType: 'marketplace_products', entityId: productId, metadata: { title: product?.title }, req });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/admin/products/approve', _POST);
